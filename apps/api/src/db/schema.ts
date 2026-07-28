import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"
import { ensureMetaTable, getSchemaVersion, setSchemaVersion, SCHEMA_VERSION } from "./meta.js"

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, "..", "..", "data", "contract-spirit.db")

let db: DatabaseSync

export function getDb(): DatabaseSync {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new DatabaseSync(DB_PATH)
    console.log(`[db] using ${DB_PATH}`)
    db.exec("PRAGMA journal_mode=WAL")
    db.exec("PRAGMA foreign_keys=ON")
    db.exec("PRAGMA busy_timeout=5000")
    db.exec("PRAGMA synchronous=NORMAL")
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      avatar TEXT,
      trust_score INTEGER NOT NULL DEFAULT 50,
      total_goals INTEGER NOT NULL DEFAULT 0,
      achieved_goals INTEGER NOT NULL DEFAULT 0,
      abandoned_goals INTEGER NOT NULL DEFAULT 0,
      total_contracts INTEGER NOT NULL DEFAULT 0,
      fulfilled_contracts INTEGER NOT NULL DEFAULT 0,
      breached_contracts INTEGER NOT NULL DEFAULT 0,
      bio TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      reward TEXT NOT NULL,
      reward_claimed INTEGER NOT NULL DEFAULT 0,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','achieved','reward_claimed','abandoned')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      achieved_at TEXT,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed','breached','cancelled')),
      reward TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      signed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('promisor','promisee','both')),
      signed_at TEXT,
      PRIMARY KEY (id, contract_id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clauses (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','fulfilled','breached')),
      due_date TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pledges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      maker TEXT NOT NULL,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','fulfilled','broken')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goal_witnesses (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      witness_user_id TEXT,
      witness_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','declined')),
      invited_at TEXT NOT NULL DEFAULT (datetime('now')),
      confirmed_at TEXT,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY (witness_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      contact TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  migrateSchema()
  applyIndexesAndVersion()
}

function applyIndexesAndVersion() {
  const version = getSchemaVersion(db)
  if (version >= SCHEMA_VERSION) return

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_goal_witnesses_goal ON goal_witnesses(goal_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event, created_at);
  `)

  setSchemaVersion(db, SCHEMA_VERSION)
}

function migrateSchema() {
  ensureMetaTable(db)
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
  const names = new Set(userCols.map((c) => c.name))

  if (!names.has("email")) {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT")
  }
  if (!names.has("password_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT")
  }
  if (!names.has("phone")) {
    db.exec("ALTER TABLE users ADD COLUMN phone TEXT")
  }
  if (!names.has("password_reset_token")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_token TEXT")
  }
  if (!names.has("password_reset_expires")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_expires TEXT")
  }

  const pledgeCols = db.prepare("PRAGMA table_info(pledges)").all() as { name: string }[]
  if (!pledgeCols.some((c) => c.name === "user_id")) {
    db.exec("ALTER TABLE pledges ADD COLUMN user_id TEXT")
  }
}
