use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
      .setup(|app| {
          if let Some(window) = app.get_webview_window("main") {
              #[cfg(debug_assertions)]
              window.open_devtools();
          }

          if cfg!(debug_assertions) {
              app.handle().plugin(
                  tauri_plugin_log::Builder::default()
                      .level(log::LevelFilter::Info)
                      .build(),
              )?;
          }
          Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}
