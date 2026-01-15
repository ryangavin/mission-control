// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::net::UdpSocket;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, RunEvent,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
#[allow(unused_imports)]
use tauri_plugin_shell::process::CommandChild;
#[allow(unused_imports)]
use tauri_plugin_shell::ShellExt;

const BRIDGE_PORT: u16 = 5555;

/// Get the local network IP address
fn get_local_ip() -> Option<String> {
    // Create a UDP socket and "connect" to a public IP to determine local interface
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    let addr = socket.local_addr().ok()?;
    Some(addr.ip().to_string())
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
            // Build tray menu
            let show_ui = MenuItem::with_id(app, "show_ui", "Show UI", true, None::<&str>)?;

            // Network URL item
            let network_label = if let Some(ip) = get_local_ip() {
                format!("http://{}:{}", ip, BRIDGE_PORT)
            } else {
                format!("http://localhost:{}", BRIDGE_PORT)
            };
            let network_url = MenuItem::with_id(app, "network_url", &network_label, true, None::<&str>)?;
            let show_qr = MenuItem::with_id(app, "show_qr", "Show QR Code", true, None::<&str>)?;

            let separator1 = MenuItem::with_id(app, "sep1", "─────────────", false, None::<&str>)?;
            let install_script = MenuItem::with_id(app, "install_script", "Install Remote Script", true, None::<&str>)?;
            let separator2 = MenuItem::with_id(app, "sep2", "─────────────", false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_ui, &network_url, &show_qr, &separator1, &install_script, &separator2, &quit])?;

            // Create tray icon with custom rocket icon
            let _tray = TrayIconBuilder::new()
                .icon(tauri::include_image!("icons/tray-icon.png"))
                .icon_as_template(false)
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    handle_menu_event(app, &event.id.0);
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
        "show_ui" => {
            let url = format!("http://localhost:{}", BRIDGE_PORT);
            if let Err(e) = open::that(&url) {
                eprintln!("Failed to open browser: {}", e);
            }
        }
        "network_url" => {
            // Copy the network URL to clipboard
            let url = if let Some(ip) = get_local_ip() {
                format!("http://{}:{}", ip, BRIDGE_PORT)
            } else {
                format!("http://localhost:{}", BRIDGE_PORT)
            };

            #[cfg(target_os = "macos")]
            {
                let _ = std::process::Command::new("pbcopy")
                    .stdin(std::process::Stdio::piped())
                    .spawn()
                    .and_then(|mut child| {
                        use std::io::Write;
                        if let Some(stdin) = child.stdin.as_mut() {
                            stdin.write_all(url.as_bytes())?;
                        }
                        child.wait()
                    });
            }

            #[cfg(target_os = "windows")]
            {
                let _ = std::process::Command::new("cmd")
                    .args(["/C", &format!("echo {}| clip", url)])
                    .spawn();
            }

            app.dialog()
                .message(format!("Copied to clipboard:\n\n{}", url))
                .title("Network URL")
                .kind(MessageDialogKind::Info)
                .blocking_show();
        }
        "show_qr" => {
            // Generate QR code URL and open in browser
            let url = if let Some(ip) = get_local_ip() {
                format!("http://{}:{}", ip, BRIDGE_PORT)
            } else {
                format!("http://localhost:{}", BRIDGE_PORT)
            };

            let qr_url = format!(
                "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={}",
                urlencoding::encode(&url)
            );

            if let Err(e) = open::that(&qr_url) {
                eprintln!("Failed to open QR code: {}", e);
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
