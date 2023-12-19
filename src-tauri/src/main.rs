#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::sync::{Arc, Mutex};
use tungstenite::accept;
use std::net::TcpListener;
use std::thread;

extern crate winapi;
use winapi::um::winbase::CREATE_NO_WINDOW;

use std::process::{Command, Stdio};
use std::os::windows::process::CommandExt;

#[tauri::command]
fn open_external(window: tauri::Window, url: String) -> Result<(), String> {
    let shell_scope = window.shell_scope();
    tauri::api::shell::open(&shell_scope, url.as_str(), None)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn my_simple_command() -> String {
    "This command is running in Tauri".to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_external])
        .invoke_handler(tauri::generate_handler![my_simple_command])
        .setup(|app| {
            let path_to_server = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("/_up_/dist-server/main.js");
            let node_path = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("/_up_/bin/node/node.exe");
            
            let npm_path = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("/_up_/bin/node/npm.cmd");

            // run npm install
            let _ = Command::new(npm_path)
                .arg("install")
                .current_dir(app.path_resolver().resource_dir().unwrap().join("/_up_/"))
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .stdin(Stdio::null())
                .creation_flags(CREATE_NO_WINDOW)
                .spawn()
                .expect("Failed to run npm install");

            // Start the Node server and keep a handle to the process
            let server_process = Arc::new(Mutex::new(
                Command::new(node_path)
                    .arg(path_to_server)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .stdin(Stdio::null())
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn()
                    .expect("Failed to start server")
            ));
        
            let server_process_clone = Arc::clone(&server_process);
            app.listen_global("tauri://close-requested", move |_| {
                let mut locked_process = server_process_clone.lock().unwrap();
                let _ = locked_process.kill();
            });

            thread::spawn(|| {
                let server = TcpListener::bind("localhost:8080").unwrap();
                for stream in server.incoming() {
                    let stream = stream.unwrap();

                    // Handle the WebSocket connection
                    let mut websocket = accept(stream).unwrap();
                    loop {
                        let msg = match websocket.read_message() {
                            Ok(msg) => msg,
                            Err(e) => {
                                println!("Error reading message: {:?}", e);
                                break;
                            }
                        };
                        println!("Received a message: {:?}", msg);
                        // Process the message and possibly send a response
                        // websocket.write_message(msg).unwrap();
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}