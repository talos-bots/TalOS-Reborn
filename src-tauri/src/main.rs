#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use actix_web::error::ErrorInternalServerError;
use actix_web::{web, App, HttpResponse, HttpServer, Error, HttpRequest};
use actix_files as fs;
use actix_web::body::to_bytes;
use std::thread;
use actix_rt;
use reqwest::{Client};
use tauri::Manager;

#[tauri::command]
fn open_external(window: tauri::Window, url: String) -> Result<(), String> {
    let shell_scope = window.shell_scope();
    tauri::api::shell::open(&shell_scope, url.as_str(), None)
        .map_err(|e| e.to_string())
}

async fn forward_to_api(req: HttpRequest, body: web::Payload, client: web::Data<Client>) -> Result<HttpResponse, Error> {
    let new_url = format!("http://localhost:3003{}", req.uri());

    // Read the entire body
    let bytes = to_bytes(body).await.map_err(ErrorInternalServerError)?;

    // Create a new request with Reqwest
    let mut client_request = client
        .request(req.method().clone(), &new_url);

    // Clone headers from the original request
    for (key, value) in req.headers() {
        client_request = client_request.header(key.clone(), value.clone());
    }

    // Set 'x-forwarded-for' header
    if let Some(addr) = req.peer_addr() {
        client_request = client_request.header("x-forwarded-for", format!("{}", addr.ip()));
    }

    // Send the request with the read body
    let response = client_request
        .body(bytes)
        .send()
        .await
        .map_err(ErrorInternalServerError)?;

    // Convert Reqwest response to Actix response
    let mut actix_response = HttpResponse::build(response.status());
    for (key, value) in response.headers().iter() {
        actix_response.insert_header((key.clone(), value.clone()));
    }

    Ok(actix_response.streaming(response.bytes_stream()))
}

fn main() {
    let client = Client::new();

    // Use `actix_rt::main` to run the server asynchronously
    thread::spawn(move || {
        actix_rt::System::new().block_on(async move {
            HttpServer::new(move || {
                App::new()
                    .app_data(web::Data::new(client.clone()))
                    .service(fs::Files::new("/", "./_up_/dist").index_file("index.html"))
                    .default_service(
                        web::route().to(forward_to_api)  // Proxy for /api
                    )
            })
            .bind("0.0.0.0:8080")
            .expect("Failed to bind to port")
            .run()
            .await
            .expect("Failed to start server");
        });
    });

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_external])
        .setup(|app| {
            let path_to_server = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("./_up_/dist-server/main.js");

            std::process::Command::new("node")
                .arg(path_to_server)
                .spawn()
                .expect("Failed to start server");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}