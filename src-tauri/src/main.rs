// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager; // Ensure this is imported

#[tauri::command]
fn open_external(window: tauri::Window, url: String) -> Result<(), String> {
    // Create a ShellScope using the window
    let shell_scope = window.shell_scope();

    // Open the URL using the shell_scope and None for the optional Program
    tauri::api::shell::open(&shell_scope, url.as_str(), None)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_external]) // Register the command
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}