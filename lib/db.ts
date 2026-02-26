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

    -- Audit Quality Score Model tables
    CREATE TABLE IF NOT EXISTS engagements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      engagement_type TEXT NOT NULL CHECK (engagement_type IN ('statutory_audit', 'voluntary_audit', 'review', 'agreed_upon_procedures', 'other')),
      financial_year_end TEXT NOT NULL,
      partner_name TEXT NOT NULL,
      office TEXT NOT NULL DEFAULT '',
      inherent_risk TEXT NOT NULL CHECK (inherent_risk IN ('low', 'moderate', 'high', 'very_high')),
      control_risk TEXT NOT NULL CHECK (control_risk IN ('low', 'moderate', 'high', 'very_high')),
      overall_rmm TEXT NOT NULL CHECK (overall_rmm IN ('low', 'moderate', 'high', 'very_high')),
      substantive_testing_extent TEXT NOT NULL CHECK (substantive_testing_extent IN ('low', 'moderate', 'high', 'very_high')),
      scored_by TEXT,
      scored_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS engagement_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engagement_id INTEGER NOT NULL,
      dimension_key TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      weight INTEGER NOT NULL CHECK (weight BETWEEN 0 AND 100),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS score_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engagement_id INTEGER NOT NULL,
      flag_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
    );
  `);

  return db;
}

export default getDb;
