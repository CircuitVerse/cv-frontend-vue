use tauri::menu::{MenuBuilder, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                let file_menu = SubmenuBuilder::new(app, "File")
                    .hide()
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
                        app.emit("new-project", ()).unwrap();
                    } else if event.id() == "save-online" {
                        app.emit("save-online", ()).unwrap();
                    } else if event.id() == "save-offline" {
                        app.emit("save-offline", ()).unwrap();
                    } else if event.id() == "open-offline" {
                        app.emit("open-offline", ()).unwrap();
                    } else if event.id() == "export" {
                        app.emit("export", ()).unwrap();
                    } else if event.id() == "import" {
                        app.emit("import", ()).unwrap();
                    } else if event.id() == "clear" {
                        app.emit("clear", ()).unwrap();
                    } else if event.id() == "recover" {
                        app.emit("recover", ()).unwrap();
                    } else if event.id() == "preview-circuit" {
                        app.emit("preview-circuit", ()).unwrap();
                    } else if event.id() == "previous-ui" {
                        app.emit("previous-ui", ()).unwrap();
                    } else if event.id() == "new-circuit" {
                        app.emit("new-circuit", ()).unwrap();
                    } else if event.id() == "new-verilog-module" {
                        app.emit("new-verilog-module", ()).unwrap();
                    } else if event.id() == "insert-sub-circuit" {
                        app.emit("insert-sub-circuit", ()).unwrap();
                    } else if event.id() == "combinational-analysis" {
                        app.emit("combinational-analysis", ()).unwrap();
                    } else if event.id() == "hex-bin-dec" {
                        app.emit("hex-bin-dec", ()).unwrap();
                    } else if event.id() == "download-image" {
                        app.emit("download-image", ()).unwrap();
                    } else if event.id() == "themes" {
                        app.emit("themes", ()).unwrap();
                    } else if event.id() == "custom-shortcut" {
                        app.emit("custom-shortcut", ()).unwrap();
                    } else if event.id() == "export-verilog" {
                        app.emit("export-verilog", ()).unwrap();
                    } else if event.id() == "tutorial" {
                        app.emit("tutorial", ()).unwrap();
                    } else if event.id() == "user-manual" {
                        app.emit("user-manual", ()).unwrap();
                    } else if event.id() == "learn-digital-logic" {
                        app.emit("learn-digital-logic", ()).unwrap();
                    } else if event.id() == "discussion-forum" {
                        app.emit("discussion-forum", ()).unwrap();
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
