// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, RunEvent,
};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

const BRIDGE_PORT: u16 = 5555;

struct AppState {
    bridge_process: Mutex<Option<CommandChild>>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            bridge_process: Mutex::new(None),
        })
        .setup(|app| {
            // Build tray menu
            let show_ui = MenuItem::with_id(app, "show_ui", "Show UI", true, None::<&str>)?;
            let install_script = MenuItem::with_id(app, "install_script", "Install Remote Script", true, None::<&str>)?;
            let separator = MenuItem::with_id(app, "sep", "─────────────", false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_ui, &install_script, &separator, &quit])?;

            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    handle_menu_event(app, &event.id.0);
                })
                .build(app)?;

            // Start bridge sidecar
            start_bridge(app.handle());

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
        "install_script" => {
            if let Err(e) = install_remote_script(app) {
                eprintln!("Failed to install remote script: {}", e);
                // TODO: Show error dialog
            }
        }
        "quit" => {
            stop_bridge(app);
            app.exit(0);
        }
        _ => {}
    }
}

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

fn install_remote_script(app: &AppHandle) -> Result<(), String> {
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

    // TODO: Show success dialog
    Ok(())
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
