import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "isqm1.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS deficiencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      component TEXT NOT NULL,
      nature TEXT NOT NULL CHECK (nature IN ('root_cause', 'symptom')),
      severity TEXT NOT NULL CHECK (severity IN ('minor', 'significant', 'pervasive')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
      identified_by TEXT,
      identified_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS remediation_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deficiency_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      assigned_to TEXT,
      due_date TEXT,
      completed_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (deficiency_id) REFERENCES deficiencies(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export default getDb;
