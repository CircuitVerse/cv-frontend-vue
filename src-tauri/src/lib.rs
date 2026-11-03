use std::sync::Mutex;
use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Listener, Manager, Runtime};

#[derive(Clone, serde::Serialize)]
struct AuthCompletePayload {
    code: Option<String>,
    state: Option<String>,
}

struct LastHandledAuthCode(Mutex<Option<String>>);

fn parse_auth_callback(url: &str) -> Option<AuthCompletePayload> {
    let parsed = url::Url::parse(url).ok()?;
    if parsed.scheme() != "circuitverse" || parsed.host_str() != Some("auth") {
        return None;
    }

    let mut code = None;
    let mut state = None;
    for (key, value) in parsed.query_pairs() {
        match key.as_ref() {
            "code" => code = Some(value.into_owned()),
            "state" => state = Some(value.into_owned()),
            _ => {}
        }
    }

    Some(AuthCompletePayload { code, state })
}

fn handle_incoming_urls<R: Runtime>(handle: &AppHandle<R>, urls: &[String]) {
    log::info!("[auth] scanning {} incoming url(s) for the auth callback", urls.len());

    let mut matched = false;
    for url in urls {
        if let Some(payload) = parse_auth_callback(url) {
            matched = true;
            log::info!(
                "[auth] matched circuitverse://auth callback, code_present={} state_present={}",
                payload.code.is_some(),
                payload.state.is_some()
            );

            if let Some(guard) = handle.try_state::<LastHandledAuthCode>() {
                let mut last = guard.0.lock().unwrap();
                if payload.code.is_some() && *last == payload.code {
                    log::info!("[auth] duplicate delivery of the same code, skipping re-emit");
                    break;
                }
                *last = payload.code.clone();
            }

            match handle.emit("cv-auth-complete", payload) {
                Ok(()) => log::info!("[auth] emitted cv-auth-complete to frontend"),
                Err(e) => log::error!("[auth] error emitting cv-auth-complete: {e}"),
            }
            if let Some(window) = handle.get_webview_window("main") {
                let _ = window.set_focus();
            }
            break;
        }
    }
    if !matched {
        log::warn!("[auth] no incoming url matched the circuitverse://auth scheme/host");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            log::info!("[auth] single-instance relaunch detected, argv={argv:?}");
            handle_incoming_urls(app, &argv);
        }))
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            app.manage(LastHandledAuthCode(Mutex::new(None)));
            log::info!("[auth] deep-link listener registered for circuitverse://auth");
            let handle = app.handle().clone();
            app.listen("deep-link://new-url", move |event| {
                log::info!("[auth] deep-link://new-url event received");
                let urls: Vec<String> = match serde_json::from_str(event.payload()) {
                    Ok(urls) => urls,
                    Err(e) => {
                        log::error!("[auth] failed to parse deep-link payload: {e}");
                        return;
                    }
                };
                handle_incoming_urls(&handle, &urls);
            });

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                let file_menu = SubmenuBuilder::new(app, "File")
                    .text("new-circuit", "New Circuit")
                    .separator()
                    .text("save-offline", "Save")
                    .text("save-online", "Save Online")
                    .separator()
                    .text("open-offline", "Open")
                    .separator()
                    .hide_others()
                    .show_all()
                    .separator()
                    .quit()
                    .build()?;

                let project_menu = SubmenuBuilder::new(app, "Project")
                    .text("new-project", "New Project")
                    .text("save-online", "Save Online")
                    .separator()
                    .text("save-offline", "Save Offline")
                    .text("open-offline", "Open Offline")
                    .separator()
                    .text("export", "Export as File")
                    .text("import", "Import Project")
                    .separator()
                    .text("clear", "Clear Project")
                    .text("recover", "Recover Project")
                    .separator()
                    .text("preview-circuit", "Preview Circuit")
                    .text("previous-ui", "Previous UI")
                    .build()?;

                let circuit_menu = SubmenuBuilder::new(app, "Circuit")
                    .text("new-circuit", "New Circuit +")
                    .text("new-verilog-module", "New Verilog Module")
                    .text("insert-sub-circuit", "Insert SubCircuit")
                    .build()?;

                let tools_menu = SubmenuBuilder::new(app, "Tools")
                    .text("combinational-analysis", "Combinational Analysis")
                    .text("hex-bin-dec", "Hex-Bin-Dec Converter")
                    .text("download-image", "Download Image")
                    .text("themes", "Themes")
                    .text("custom-shortcut", "Custom Shortcut")
                    .text("export-verilog", "Export Verilog")
                    .build()?;

                let help_menu = SubmenuBuilder::new(app, "Help")
                    .text("tutorial", "Tutorial Guide")
                    .text("user-manual", "User Manual")
                    .text("learn-digital-logic", "Learn Digital Logic")
                    .text("discussion-forum", "Discussion Forum")
                    .build()?;

                let menu = MenuBuilder::new(app)
                    .items(&[
                        &file_menu,
                        &project_menu,
                        &circuit_menu,
                        &tools_menu,
                        &help_menu,
                    ])
                    .build()?;

                app.set_menu(menu)?;

                app.on_menu_event(move |app, event| {
                    if event.id() == "new-project" {
                        if let Err(e) = app.emit("new-project", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "save-online" {
                        if let Err(e) = app.emit("save-online", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "save-offline" {
                        if let Err(e) = app.emit("save-offline", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "open-offline" {
                        if let Err(e) = app.emit("open-offline", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "export" {
                        if let Err(e) = app.emit("export", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "import" {
                        if let Err(e) = app.emit("import", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "clear" {
                        if let Err(e) = app.emit("clear", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "recover" {
                        if let Err(e) = app.emit("recover", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "preview-circuit" {
                        if let Err(e) = app.emit("preview-circuit", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "previous-ui" {
                        if let Err(e) = app.emit("previous-ui", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "new-circuit" {
                        if let Err(e) = app.emit("new-circuit", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "new-verilog-module" {
                        if let Err(e) = app.emit("new-verilog-module", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "insert-sub-circuit" {
                        if let Err(e) = app.emit("insert-sub-circuit", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "combinational-analysis" {
                        if let Err(e) = app.emit("combinational-analysis", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "hex-bin-dec" {
                        if let Err(e) = app.emit("hex-bin-dec", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "download-image" {
                        if let Err(e) = app.emit("download-image", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "themes" {
                        if let Err(e) = app.emit("themes", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "custom-shortcut" {
                        if let Err(e) = app.emit("custom-shortcut", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "export-verilog" {
                        if let Err(e) = app.emit("export-verilog", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "tutorial" {
                        if let Err(e) = app.emit("tutorial", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "user-manual" {
                        if let Err(e) = app.emit("user-manual", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "learn-digital-logic" {
                        if let Err(e) = app.emit("learn-digital-logic", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    } else if event.id() == "discussion-forum" {
                        if let Err(e) = app.emit("discussion-forum", ()) {
                            eprintln!("Error emitting event: {}", e);
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
