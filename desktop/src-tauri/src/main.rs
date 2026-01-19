// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::net::UdpSocket;
use std::path::PathBuf;
use std::sync::Mutex;
use qrcode::QrCode;
use image::Luma;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    AppHandle, Manager, RunEvent,
};
#[cfg(not(debug_assertions))]
use tauri::menu::CheckMenuItem;
use tauri_plugin_autostart::MacosLauncher;
#[cfg(not(debug_assertions))]
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
#[cfg(not(debug_assertions))]
use tauri_plugin_dialog::MessageDialogButtons;
#[cfg(not(debug_assertions))]
use tauri_plugin_updater::UpdaterExt;
#[allow(unused_imports)]
use tauri_plugin_shell::process::CommandChild;
#[allow(unused_imports)]
use tauri_plugin_shell::ShellExt;

// Port depends on dev vs release mode
#[cfg(debug_assertions)]
const UI_PORT: u16 = 5173; // Vite dev server
#[cfg(not(debug_assertions))]
const UI_PORT: u16 = 5555; // Standalone bridge

/// Get the local network IP address
fn get_local_ip() -> Option<String> {
    // Create a UDP socket and "connect" to a public IP to determine local interface
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    let addr = socket.local_addr().ok()?;
    Some(addr.ip().to_string())
}

/// Generate a QR code as base64-encoded PNG
fn generate_qr_code_base64(data: &str) -> Result<String, String> {
    use image::ImageEncoder;

    let code = QrCode::new(data.as_bytes())
        .map_err(|e| format!("Failed to create QR code: {}", e))?;

    let image = code.render::<Luma<u8>>()
        .min_dimensions(300, 300)
        .build();

    let mut png_bytes: Vec<u8> = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder.write_image(
        image.as_raw(),
        image.width(),
        image.height(),
        image::ExtendedColorType::L8,
    ).map_err(|e| format!("Failed to encode PNG: {}", e))?;

    Ok(BASE64.encode(&png_bytes))
}

struct AppState {
    bridge_process: Mutex<Option<CommandChild>>,
    quit_requested: Mutex<bool>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            bridge_process: Mutex::new(None),
            quit_requested: Mutex::new(false),
        })
        .setup(|app| {
            // Hide from dock, only show in system tray
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Build tray menu
            let help = MenuItem::with_id(app, "help", "Help", true, None::<&str>)?;
            let separator1 = PredefinedMenuItem::separator(app)?;
            let open_ui = MenuItem::with_id(app, "open_ui", "Open Mission Control", true, None::<&str>)?;
            let show_qr = MenuItem::with_id(app, "show_qr", "Connect Another Device", true, None::<&str>)?;
            let separator2 = PredefinedMenuItem::separator(app)?;
            let install_script = MenuItem::with_id(app, "install_script", "Install AbletonOSC", true, None::<&str>)?;
            let donate = MenuItem::with_id(app, "donate", "Donate ❤️", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Only show autostart and updates options in release builds
            #[cfg(not(debug_assertions))]
            let menu = {
                let autostart_manager = app.autolaunch();
                let autostart_enabled = autostart_manager.is_enabled().unwrap_or(false);
                let autostart = CheckMenuItem::with_id(app, "autostart", "Start Automatically", true, autostart_enabled, None::<&str>)?;
                let check_updates = MenuItem::with_id(app, "check_updates", "Check for Updates...", true, None::<&str>)?;
                let separator3 = PredefinedMenuItem::separator(app)?;
                Menu::with_items(app, &[&help, &separator1, &open_ui, &show_qr, &separator2, &install_script, &autostart, &check_updates, &separator3, &donate, &quit])?
            };

            #[cfg(debug_assertions)]
            let menu = {
                let separator3 = PredefinedMenuItem::separator(app)?;
                Menu::with_items(app, &[&help, &separator1, &open_ui, &show_qr, &separator2, &install_script, &separator3, &donate, &quit])?
            };

            // Create tray icon with custom rocket icon
            let _tray = TrayIconBuilder::new()
                .icon(tauri::include_image!("icons/tray-icon.png"))
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    handle_menu_event(app, &event.id.0);
                })
                .on_tray_icon_event(|_tray, event| {
                    match event {
                        TrayIconEvent::Click { button, .. } => {
                            println!("[tray] Click: {:?}", button);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Start bridge sidecar (only in release builds)
            // In dev mode, run `bun run server/standalone.ts` separately
            #[cfg(not(debug_assertions))]
            start_bridge(app.handle());

            #[cfg(debug_assertions)]
            println!("[dev] Skipping sidecar - run `bun run server/standalone.ts` manually");

            // Check for updates on startup (release only)
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    // Small delay to let app fully initialize
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                    if let Err(e) = check_for_updates(handle, false).await {
                        eprintln!("Update check failed: {}", e);
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            match event {
                RunEvent::ExitRequested { api, .. } => {
                    let state = app.state::<AppState>();
                    let quit_requested = *state.quit_requested.lock().unwrap();

                    if !quit_requested {
                        // Only prevent exit for window closes, not deliberate quit
                        api.prevent_exit();
                    }
                }
                RunEvent::Exit => {
                    // Stop bridge on exit
                    stop_bridge(app);
                }
                _ => {}
            }
        });
}

fn handle_menu_event(app: &AppHandle, id: &str) {
    match id {
        "open_ui" => {
            let url = format!("http://localhost:{}", UI_PORT);
            if let Err(e) = open::that(&url) {
                eprintln!("Failed to open browser: {}", e);
            }
        }
        "show_qr" => {
            // If QR window already exists, focus it
            if let Some(window) = app.get_webview_window("qr") {
                let _ = window.set_focus();
                return;
            }

            // Generate QR code and show in window
            let url = if let Some(ip) = get_local_ip() {
                format!("http://{}:{}", ip, UI_PORT)
            } else {
                format!("http://localhost:{}", UI_PORT)
            };

            match generate_qr_code_base64(&url) {
                Ok(base64_png) => {
                    let html = format!(r#"
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                * {{
                                    box-sizing: border-box;
                                }}
                                body {{
                                    margin: 0;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%);
                                    color: #fff;
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                    padding: 24px;
                                }}
                                .card {{
                                    background: linear-gradient(145deg, #242424 0%, #1a1a1a 100%);
                                    border: 1px solid #333;
                                    border-radius: 16px;
                                    padding: 20px;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                                }}
                                h1 {{
                                    margin: 0 0 16px 0;
                                    font-size: 18px;
                                    font-weight: 600;
                                    color: #fff;
                                }}
                                .qr-container {{
                                    background: #fff;
                                    padding: 12px;
                                    border-radius: 12px;
                                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                                }}
                                img {{
                                    display: block;
                                    border-radius: 4px;
                                }}
                                .url {{
                                    margin: 16px 0 0 0;
                                    font-size: 12px;
                                    color: #f90;
                                    font-family: 'SF Mono', Menlo, Monaco, monospace;
                                    background: rgba(255, 153, 0, 0.1);
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    border: 1px solid rgba(255, 153, 0, 0.2);
                                }}
                                .hint {{
                                    margin: 8px 0 0 0;
                                    font-size: 11px;
                                    color: #666;
                                }}
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <h1>Scan to Connect</h1>
                                <div class="qr-container">
                                    <img src="data:image/png;base64,{}" width="180" height="180" />
                                </div>
                                <p class="url">{}</p>
                                <p class="hint">or visit the URL directly</p>
                            </div>
                        </body>
                        </html>
                    "#, base64_png, url);

                    let data_url = format!("data:text/html,{}", urlencoding::encode(&html));
                    match data_url.parse() {
                        Ok(parsed_url) => {
                            match WebviewWindowBuilder::new(app, "qr", tauri::WebviewUrl::External(parsed_url))
                                .title("Connect Another Device")
                                .inner_size(320.0, 400.0)
                                .resizable(false)
                                .center()
                                .build()
                            {
                                Ok(_) => {}
                                Err(e) => {
                                    eprintln!("Failed to create QR window: {}", e);
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Failed to parse data URL: {}", e);
                            app.dialog()
                                .message("Failed to create QR code window")
                                .title("Error")
                                .kind(MessageDialogKind::Error)
                                .blocking_show();
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Failed to generate QR code: {}", e);
                    app.dialog()
                        .message(format!("Failed to generate QR code:\n\n{}", e))
                        .title("Error")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                }
            }
        }
        "install_script" => {
            match install_remote_script(app) {
                Ok(path) => {
                    app.dialog()
                        .message(format!(
                            "AbletonOSC installed successfully.\n\nLocation: {}\n\nRestart Ableton Live and enable AbletonOSC in Preferences → Link, Tempo & MIDI → Control Surface.",
                            path
                        ))
                        .title("Installation Complete")
                        .kind(MessageDialogKind::Info)
                        .blocking_show();
                }
                Err(e) => {
                    eprintln!("Failed to install remote script: {}", e);
                    app.dialog()
                        .message(format!("Failed to install remote script:\n\n{}", e))
                        .title("Installation Failed")
                        .kind(MessageDialogKind::Error)
                        .blocking_show();
                }
            }
        }
        #[cfg(not(debug_assertions))]
        "autostart" => {
            let autostart_manager = app.autolaunch();
            let is_enabled = autostart_manager.is_enabled().unwrap_or(false);

            if is_enabled {
                if let Err(e) = autostart_manager.disable() {
                    eprintln!("Failed to disable autostart: {}", e);
                }
            } else {
                if let Err(e) = autostart_manager.enable() {
                    eprintln!("Failed to enable autostart: {}", e);
                }
            }
        }
        #[cfg(not(debug_assertions))]
        "check_updates" => {
            let handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = check_for_updates(handle, true).await {
                    eprintln!("Update check failed: {}", e);
                }
            });
        }
        "help" => {
            if let Err(e) = open::that("https://github.com/ryangavin/mission-control/blob/main/docs/MANUAL.md") {
                eprintln!("Failed to open help link: {}", e);
            }
        }
        "donate" => {
            if let Err(e) = open::that("https://ko-fi.com/ryangavin") {
                eprintln!("Failed to open donate link: {}", e);
            }
        }
        "quit" => {
            // Set quit flag so ExitRequested handler allows exit
            let state = app.state::<AppState>();
            *state.quit_requested.lock().unwrap() = true;

            // stop_bridge is called in RunEvent::Exit handler
            app.exit(0);
        }
        _ => {}
    }
}

#[cfg(not(debug_assertions))]
fn start_bridge(app: &AppHandle) {
    let state = app.state::<AppState>();
    let mut process = state.bridge_process.lock().unwrap();

    if process.is_some() {
        println!("Bridge already running");
        return;
    }

    // Get the sidecar command
    let shell = app.shell();

    match shell.sidecar("mission-control-bridge") {
        Ok(cmd) => {
            match cmd.spawn() {
                Ok((_, child)) => {
                    println!("Bridge started on port {}", UI_PORT);
                    *process = Some(child);
                }
                Err(e) => {
                    eprintln!("Failed to start bridge: {}", e);
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to create sidecar command: {}", e);
        }
    }
}

fn stop_bridge(app: &AppHandle) {
    let state = app.state::<AppState>();
    let mut process = state.bridge_process.lock().unwrap();

    if let Some(child) = process.take() {
        if let Err(e) = child.kill() {
            eprintln!("Failed to kill bridge: {}", e);
        } else {
            println!("Bridge stopped");
        }
    }
}

#[cfg(not(debug_assertions))]
async fn check_for_updates(app: AppHandle, manual: bool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Skip auto-updates for edge builds
    if env!("CARGO_PKG_VERSION").contains("edge") {
        if manual {
            app.dialog()
                .message("Auto-updates are disabled for edge builds.\n\nDownload the latest edge build from GitHub.")
                .title("Edge Build")
                .blocking_show();
        }
        return Ok(());
    }

    let updater = app.updater()?;

    match updater.check().await {
        Ok(Some(update)) => {
            println!("Update available: {}", update.version);

            let should_update = app.dialog()
                .message(format!(
                    "Version {} is available (you have {}).\n\nWould you like to install it now?",
                    update.version,
                    env!("CARGO_PKG_VERSION")
                ))
                .title("Update Available")
                .buttons(MessageDialogButtons::OkCancelCustom("Install".into(), "Later".into()))
                .blocking_show();

            if should_update {
                println!("Downloading update...");

                // Download and install with progress callbacks
                update.download_and_install(
                    |downloaded, total| {
                        if let Some(total) = total {
                            let percent = (downloaded as f64 / total as f64 * 100.0) as u32;
                            println!("Downloading: {}%", percent);
                        }
                    },
                    || {
                        println!("Download complete, installing...");
                    }
                ).await?;

                println!("Update installed, restarting...");
                app.restart();
            }
        }
        Ok(None) => {
            println!("No updates available");
            if manual {
                app.dialog()
                    .message("You're running the latest version.")
                    .title("No Updates")
                    .kind(MessageDialogKind::Info)
                    .blocking_show();
            }
        }
        Err(e) => {
            eprintln!("Update check error: {}", e);
            if manual {
                app.dialog()
                    .message(format!("Failed to check for updates:\n\n{}", e))
                    .title("Update Error")
                    .kind(MessageDialogKind::Error)
                    .blocking_show();
            }
            return Err(e.into());
        }
    }

    Ok(())
}

fn get_remote_scripts_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;

    #[cfg(target_os = "macos")]
    let path = home.join("Music/Ableton/User Library/Remote Scripts");

    #[cfg(target_os = "windows")]
    let path = home.join("Documents/Ableton/User Library/Remote Scripts");

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    return Err("Unsupported operating system".to_string());

    Ok(path)
}

fn install_remote_script(app: &AppHandle) -> Result<String, String> {
    // Get source path (bundled AbletonOSC)
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Could not get resource dir: {}", e))?
        .join("AbletonOSC");

    // Get destination path
    let dest_dir = get_remote_scripts_path()?;
    let dest_path = dest_dir.join("AbletonOSC");

    // Create Remote Scripts directory if it doesn't exist
    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Could not create Remote Scripts directory: {}", e))?;

    // Remove existing installation if present
    if dest_path.exists() {
        fs::remove_dir_all(&dest_path)
            .map_err(|e| format!("Could not remove existing installation: {}", e))?;
    }

    // Copy AbletonOSC to Remote Scripts
    copy_dir_recursive(&resource_path, &dest_path)?;

    println!("Remote script installed to: {:?}", dest_path);

    Ok(dest_path.to_string_lossy().to_string())
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Could not create directory {:?}: {}", dst, e))?;

    for entry in fs::read_dir(src).map_err(|e| format!("Could not read dir: {}", e))? {
        let entry = entry.map_err(|e| format!("Could not read entry: {}", e))?;
        let path = entry.path();
        let dest_path = dst.join(entry.file_name());

        if path.is_dir() {
            copy_dir_recursive(&path, &dest_path)?;
        } else {
            fs::copy(&path, &dest_path)
                .map_err(|e| format!("Could not copy {:?}: {}", path, e))?;
        }
    }

    Ok(())
}
