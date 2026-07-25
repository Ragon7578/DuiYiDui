import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.resolve(__dirname, "..", "..", "data", "contract-spirit.db")

let db: DatabaseSync

export function getDb(): DatabaseSync {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new DatabaseSync(DB_PATH)
    db.exec("PRAGMA journal_mode=WAL")
    db.exec("PRAGMA foreign_keys=ON")
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}
