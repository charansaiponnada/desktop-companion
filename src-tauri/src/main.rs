#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{Connection, params};
use std::sync::Mutex;
use tauri::Manager;

struct Db(Mutex<Connection>);

fn init_db(conn: &Connection) {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            value TEXT,
            app TEXT
        );
        CREATE TABLE IF NOT EXISTS daily_summary (
            date TEXT PRIMARY KEY,
            summary TEXT NOT NULL,
            mood TEXT,
            created_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            fire_at INTEGER NOT NULL,
            repeat_ms INTEGER,
            fired INTEGER DEFAULT 0
        );
    ").expect("DB init failed");
}

#[tauri::command]
fn db_log_event(db: tauri::State<Db>, event_type: String, value: Option<String>, app: Option<String>, ts: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO activity_log (ts, event_type, value, app) VALUES (?1,?2,?3,?4)",
        params![ts, event_type, value, app],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_set_pref(db: tauri::State<Db>, key: String, value: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO preferences (key, value) VALUES (?1,?2)",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_get_pref(db: tauri::State<Db>, key: String) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    match conn.query_row("SELECT value FROM preferences WHERE key = ?1", params![key], |row| row.get(0)) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn db_get_recent_summaries(db: tauri::State<Db>, n: i64) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT date, summary, mood FROM daily_summary ORDER BY date DESC LIMIT ?1"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![n], |row| {
        Ok(serde_json::json!({
            "date":    row.get::<_, String>(0)?,
            "summary": row.get::<_, String>(1)?,
            "mood":    row.get::<_, Option<String>>(2)?,
        }))
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(rows)
}

#[tauri::command]
fn db_save_summary(db: tauri::State<Db>, date: String, summary: String, mood: Option<String>, created_at: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO daily_summary (date, summary, mood, created_at) VALUES (?1,?2,?3,?4)",
        params![date, summary, mood, created_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_get_pending_reminders(db: tauri::State<Db>, now: i64) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, message, fire_at, repeat_ms FROM reminders WHERE fire_at <= ?1 AND fired = 0"
    ).map_err(|e| e.to_string())?;
    let rows: Vec<serde_json::Value> = stmt.query_map(params![now], |row| {
        Ok(serde_json::json!({
            "id":        row.get::<_, i64>(0)?,
            "message":   row.get::<_, String>(1)?,
            "fire_at":   row.get::<_, i64>(2)?,
            "repeat_ms": row.get::<_, Option<i64>>(3)?,
        }))
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    for row in &rows {
        let id = row["id"].as_i64().unwrap_or(0);
        if let Some(repeat) = row["repeat_ms"].as_i64() {
            conn.execute("UPDATE reminders SET fire_at = ?1 WHERE id = ?2", params![now + repeat, id]).ok();
        } else {
            conn.execute("UPDATE reminders SET fired = 1 WHERE id = ?1", params![id]).ok();
        }
    }
    Ok(rows)
}

#[tauri::command]
fn db_add_reminder(db: tauri::State<Db>, message: String, fire_at: i64, repeat_ms: Option<i64>) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO reminders (message, fire_at, repeat_ms) VALUES (?1,?2,?3)",
        params![message, fire_at, repeat_ms],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
fn start_window_drag(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window.start_dragging().map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = app.path().app_data_dir()
                .expect("no app data dir")
                .join("companion.db");
            std::fs::create_dir_all(db_path.parent().unwrap()).ok();
            let conn = Connection::open(&db_path).expect("DB open failed");
            init_db(&conn);
            app.manage(Db(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db_log_event,
            db_set_pref,
            db_get_pref,
            db_get_recent_summaries,
            db_save_summary,
            db_get_pending_reminders,
            db_add_reminder,
            start_window_drag,
        ])
        .run(tauri::generate_context!())
        .expect("error running companion");
}