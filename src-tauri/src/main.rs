// companion — Tauri backend
// transparent always-on-top window, SQLite memory, system tray

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{Connection, params};
use std::sync::Mutex;
use tauri::{
    AppHandle, Manager, State, SystemTray, SystemTrayEvent,
    SystemTrayMenu, CustomMenuItem, WindowBuilder, WindowUrl,
};

// ── db state ─────────────────────────────────────────────────────────────────
struct Db(Mutex<Connection>);

fn init_db(conn: &Connection) {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS activity_log (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            ts         INTEGER NOT NULL,
            event_type TEXT    NOT NULL,
            value      TEXT,
            app        TEXT
        );
        CREATE TABLE IF NOT EXISTS daily_summary (
            date       TEXT PRIMARY KEY,
            summary    TEXT NOT NULL,
            mood       TEXT,
            created_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS preferences (
            key   TEXT PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS reminders (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            message   TEXT NOT NULL,
            fire_at   INTEGER NOT NULL,
            repeat_ms INTEGER,
            fired     INTEGER DEFAULT 0
        );
    ").expect("DB init failed");
}

// ── tauri commands ────────────────────────────────────────────────────────────
#[tauri::command]
fn db_log_event(
    db: State<Db>,
    event_type: String,
    value: Option<String>,
    app: Option<String>,
    ts: i64,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO activity_log (ts, event_type, value, app) VALUES (?1,?2,?3,?4)",
        params![ts, event_type, value, app],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_get_day_stats(db: State<Db>, date: String) -> Result<serde_json::Value, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let day_start = chrono_date_to_ts(&date);
    let day_end   = day_start + 86_400_000;

    let mut stmt = conn.prepare(
        "SELECT event_type, COUNT(*) as cnt FROM activity_log
         WHERE ts >= ?1 AND ts < ?2
         GROUP BY event_type"
    ).map_err(|e| e.to_string())?;

    let rows: Vec<(String, i64)> = stmt
        .query_map(params![day_start, day_end], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let obj: serde_json::Map<String, serde_json::Value> = rows
        .into_iter()
        .map(|(k, v)| (k, serde_json::Value::Number(v.into())))
        .collect();

    Ok(serde_json::Value::Object(obj))
}

#[tauri::command]
fn db_save_summary(
    db: State<Db>,
    date: String,
    summary: String,
    mood: Option<String>,
    created_at: i64,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO daily_summary (date, summary, mood, created_at)
         VALUES (?1,?2,?3,?4)",
        params![date, summary, mood, created_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_get_recent_summaries(db: State<Db>, n: i64) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT date, summary, mood FROM daily_summary
         ORDER BY date DESC LIMIT ?1"
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
fn db_set_pref(db: State<Db>, key: String, value: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO preferences (key, value) VALUES (?1,?2)",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_get_pref(db: State<Db>, key: String) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT value FROM preferences WHERE key = ?1",
        params![key],
        |row| row.get(0),
    );
    match result {
        Ok(v)                              => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e)                             => Err(e.to_string()),
    }
}

#[tauri::command]
fn db_add_reminder(
    db: State<Db>,
    message: String,
    fire_at: i64,
    repeat_ms: Option<i64>,
) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO reminders (message, fire_at, repeat_ms) VALUES (?1,?2,?3)",
        params![message, fire_at, repeat_ms],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
fn db_get_pending_reminders(db: State<Db>, now: i64) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, message, fire_at, repeat_ms FROM reminders
         WHERE fire_at <= ?1 AND fired = 0"
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

    // mark as fired (reschedule if repeat)
    for row in &rows {
        let id = row["id"].as_i64().unwrap_or(0);
        if let Some(repeat) = row["repeat_ms"].as_i64() {
            let next = now + repeat;
            conn.execute(
                "UPDATE reminders SET fire_at = ?1 WHERE id = ?2",
                params![next, id],
            ).ok();
        } else {
            conn.execute(
                "UPDATE reminders SET fired = 1 WHERE id = ?1",
                params![id],
            ).ok();
        }
    }

    Ok(rows)
}

// ── helpers ───────────────────────────────────────────────────────────────────
fn chrono_date_to_ts(date: &str) -> i64 {
    // "YYYY-MM-DD" → unix ms at midnight UTC (approximate)
    let parts: Vec<i64> = date.split('-')
        .filter_map(|s| s.parse().ok())
        .collect();
    if parts.len() != 3 { return 0; }
    // days since epoch (rough, ignores leap seconds)
    let y = parts[0] - 1970;
    let m = parts[1] - 1;
    let d = parts[2] - 1;
    let days = y * 365 + y / 4 + m * 30 + d; // good enough for daily bucketing
    days * 86_400_000
}

// ── main ──────────────────────────────────────────────────────────────────────
fn main() {
    // system tray
    let quit      = CustomMenuItem::new("quit".to_string(),    "Quit companion");
    let settings  = CustomMenuItem::new("settings".to_string(), "Settings");
    let tray_menu = SystemTrayMenu::new().add_item(settings).add_item(quit);
    let tray      = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                if id == "quit" { std::process::exit(0); }
                if id == "settings" {
                    if let Some(win) = app.get_window("main") {
                        let _ = win.emit("open-settings", ());
                    }
                }
            }
            _ => {}
        })
        .setup(|app| {
            // open DB
            let db_path = app.path_resolver()
                .app_data_dir()
                .expect("no app data dir")
                .join("companion.db");
            std::fs::create_dir_all(db_path.parent().unwrap()).ok();
            let conn = Connection::open(&db_path).expect("DB open failed");
            init_db(&conn);
            app.manage(Db(Mutex::new(conn)));

            // create transparent always-on-top window
            WindowBuilder::new(app, "main", WindowUrl::App("index.html".into()))
                .title("companion")
                .inner_size(200.0, 220.0)
                .decorations(false)
                .transparent(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .resizable(false)
                .build()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db_log_event,
            db_get_day_stats,
            db_save_summary,
            db_get_recent_summaries,
            db_set_pref,
            db_get_pref,
            db_add_reminder,
            db_get_pending_reminders,
        ])
        .run(tauri::generate_context!())
        .expect("error running companion");
}
