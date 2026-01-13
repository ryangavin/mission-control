// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State,
};

// Bridge process state
struct BridgeState {
    process: Mutex<Option<Child>>,
    running: Mutex<bool>,
}

impl Default for BridgeState {
    fn default() -> Self {
        Self {
            process: Mutex::new(None),
            running: Mutex::new(false),
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BridgeState::default())
        .setup(|app| {
            // Create menu items
            let start_stop = MenuItem::with_id(app, "start_stop", "Start Bridge", true, None::<&str>)?;
            let install_script = MenuItem::with_id(app, "install_script", "Install Remote Script", true, None::<&str>)?;
            let open_web_ui = MenuItem::with_id(app, "open_web_ui", "Open Web UI", true, None::<&str>)?;
            let separator = MenuItem::with_id(app, "sep", "─────────────", false, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Build the menu
            let menu = Menu::with_items(
                app,
                &[&start_stop, &install_script, &open_web_ui, &separator, &quit],
            )?;

            // Load tray icon
            let icon = load_tray_icon();

            // Create tray
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("MC Bridge")
                .on_menu_event(|app, event| {
                    handle_menu_event(app, event.id.as_ref());
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        // Left click shows the menu on macOS
                        let _ = tray.app_handle();
                    }
                })
                .build(app)?;

            // Start status polling
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                poll_bridge_status(handle);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn load_tray_icon() -> Image<'static> {
    Image::from_bytes(include_bytes!("../icons/icon.png"))
        .expect("Failed to load tray icon")
}

fn handle_menu_event(app: &AppHandle, event_id: &str) {
    match event_id {
        "start_stop" => {
            toggle_bridge(app);
        }
        "install_script" => {
            install_remote_script(app);
        }
        "open_web_ui" => {
            // TODO: Replace with actual GitHub Pages URL
            let _ = open::that("https://yourusername.github.io/mission-control/");
        }
        "quit" => {
            // Stop bridge before quitting
            let state: State<BridgeState> = app.state();
            stop_bridge(&state);
            app.exit(0);
        }
        _ => {}
    }
}

fn toggle_bridge(app: &AppHandle) {
    let state: State<BridgeState> = app.state();
    let running = *state.running.lock().unwrap();

    if running {
        stop_bridge(&state);
        update_menu_item(app, "start_stop", "Start Bridge");
    } else {
        start_bridge(app, &state);
        update_menu_item(app, "start_stop", "Stop Bridge");
    }
}

fn start_bridge(app: &AppHandle, state: &State<BridgeState>) {
    // Get the sidecar binary path
    let sidecar_path = get_sidecar_path(app);

    println!("Starting bridge from: {:?}", sidecar_path);

    match Command::new(&sidecar_path)
        .arg("start")
        .spawn()
    {
        Ok(child) => {
            *state.process.lock().unwrap() = Some(child);
            *state.running.lock().unwrap() = true;
            println!("Bridge started successfully");
        }
        Err(e) => {
            eprintln!("Failed to start bridge: {}", e);
            // TODO: Show error notification to user
        }
    }
}

fn stop_bridge(state: &State<BridgeState>) {
    let mut process = state.process.lock().unwrap();
    if let Some(ref mut child) = *process {
        let _ = child.kill();
        let _ = child.wait();
    }
    *process = None;
    *state.running.lock().unwrap() = false;
    println!("Bridge stopped");
}

fn get_sidecar_path(app: &AppHandle) -> std::path::PathBuf {
    // In development, look for the binary in the binaries folder
    // In production, it's bundled with the app
    let resource_dir = app.path().resource_dir().expect("Failed to get resource dir");

    #[cfg(target_os = "macos")]
    let binary_name = "mission-control-bridge";

    #[cfg(target_os = "windows")]
    let binary_name = "mission-control-bridge.exe";

    #[cfg(target_os = "linux")]
    let binary_name = "mission-control-bridge";

    resource_dir.join("binaries").join(binary_name)
}

fn install_remote_script(app: &AppHandle) {
    // Get the remote script from resources
    let resource_dir = app.path().resource_dir().expect("Failed to get resource dir");
    let script_source = resource_dir.join("AbletonOSC");

    // Get Ableton's remote scripts directory
    let remote_scripts_dir = get_ableton_remote_scripts_dir();

    if let Some(dest_dir) = remote_scripts_dir {
        let dest = dest_dir.join("AbletonOSC");

        // Copy the remote script
        match copy_dir_recursive(&script_source, &dest) {
            Ok(_) => {
                println!("Remote script installed to: {:?}", dest);
                // TODO: Show success notification
            }
            Err(e) => {
                eprintln!("Failed to install remote script: {}", e);
                // TODO: Show error notification
            }
        }
    } else {
        eprintln!("Could not find Ableton Remote Scripts directory");
        // TODO: Show error notification
    }
}

fn get_ableton_remote_scripts_dir() -> Option<std::path::PathBuf> {
    #[cfg(target_os = "macos")]
    {
        dirs::home_dir().map(|h| h.join("Music/Ableton/User Library/Remote Scripts"))
    }

    #[cfg(target_os = "windows")]
    {
        dirs::document_dir().map(|d| d.join("Ableton/User Library/Remote Scripts"))
    }

    #[cfg(target_os = "linux")]
    {
        dirs::home_dir().map(|h| h.join("Ableton/User Library/Remote Scripts"))
    }
}

fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    if !dst.exists() {
        std::fs::create_dir_all(dst)?;
    }

    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if file_type.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

fn update_menu_item(app: &AppHandle, id: &str, title: &str) {
    // Note: Tauri 2 menu updates require recreating the menu
    // For now, we'll handle this via the polling mechanism
    let _ = (app, id, title);
}

fn poll_bridge_status(_app: AppHandle) {
    // Status polling for future use (e.g., updating menu items)
    // Currently just keeps the app alive
    loop {
        std::thread::sleep(Duration::from_secs(60));
    }
}
