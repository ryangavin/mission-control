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
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    AppHandle, Manager, RunEvent,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
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
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            bridge_process: Mutex::new(None),
        })
        .setup(|app| {
            // Hide from dock, only show in system tray
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Build tray menu
            let open_ui = MenuItem::with_id(app, "open_ui", "Open Mission Control", true, None::<&str>)?;
            let show_qr = MenuItem::with_id(app, "show_qr", "Connect on Mobile", true, None::<&str>)?;
            let separator1 = MenuItem::with_id(app, "sep1", "─────────────", false, None::<&str>)?;
            let install_script = MenuItem::with_id(app, "install_script", "Install AbletonOSC", true, None::<&str>)?;
            let separator2 = MenuItem::with_id(app, "sep2", "─────────────", false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&open_ui, &show_qr, &separator1, &install_script, &separator2, &quit])?;

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

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                // Stop bridge on exit
                stop_bridge(app);
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
                                body {{
                                    margin: 0;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    background: #1a1a1a;
                                    color: #fff;
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                }}
                                img {{
                                    border-radius: 8px;
                                }}
                                p {{
                                    margin-top: 16px;
                                    font-size: 14px;
                                    color: #888;
                                }}
                            </style>
                        </head>
                        <body>
                            <img src="data:image/png;base64,{}" width="300" height="300" />
                            <p>{}</p>
                        </body>
                        </html>
                    "#, base64_png, url);

                    let data_url = format!("data:text/html,{}", urlencoding::encode(&html));
                    match WebviewWindowBuilder::new(app, "qr", tauri::WebviewUrl::External(data_url.parse().unwrap()))
                        .title("Connect on Mobile")
                        .inner_size(350.0, 420.0)
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
        "quit" => {
            stop_bridge(app);
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
                    println!("Bridge started on port {}", BRIDGE_PORT);
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
