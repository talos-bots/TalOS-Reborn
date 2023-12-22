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
            let path_to_server_folder = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("/_up_/dist/");

            let resource_dir = app.path_resolver().resource_dir()
            .expect("Failed to resolve resource directory");
            let up_dir = resource_dir.join("_up_");
            let npm_install_dir = up_dir.join("dist");

            // Debugging: Print the directory path
            println!("npm install directory: {:?}", npm_install_dir);

            // Check if the directory exists
            if !npm_install_dir.exists() {
                panic!("npm install directory does not exist: {:?}", npm_install_dir);
            }

            // npm install command
            match Command::new("cmd")
                .args(&["/C", "npm", "install"])
                .current_dir(npm_install_dir) // Set the correct directory
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .stdin(Stdio::null())
                .creation_flags(CREATE_NO_WINDOW)
                .spawn() {
                    Ok(_) => println!("npm install started successfully"),
                    Err(e) => panic!("Failed to run npm install: {:?}", e),
                };
        

            // Start the Node server and keep a handle to the process
            let server_process = Arc::new(Mutex::new(
                Command::new("node")
                    .arg("server.js") // Specify just the file name here
                    .current_dir(&path_to_server_folder) // Change the working directory
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