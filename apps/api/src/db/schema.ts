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
      phone TEXT,
      password_hash TEXT,
      password_reset_token TEXT,
      password_reset_expires TEXT,
      avatar TEXT,
      trust_score INTEGER NOT NULL DEFAULT 50 CHECK(trust_score >= 0 AND trust_score <= 100),
      total_goals INTEGER NOT NULL DEFAULT 0,
      achieved_goals INTEGER NOT NULL DEFAULT 0,
      abandoned_goals INTEGER NOT NULL DEFAULT 0,
      total_contracts INTEGER NOT NULL DEFAULT 0,
      fulfilled_contracts INTEGER NOT NULL DEFAULT 0,
      breached_contracts INTEGER NOT NULL DEFAULT 0,
      bio TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      reward TEXT NOT NULL,
      reward_claimed INTEGER NOT NULL DEFAULT 0 CHECK(reward_claimed IN (0, 1)),
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','achieved','reward_claimed','abandoned')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      achieved_at TEXT,
      reward_claimed_at TEXT,
      abandoned_at TEXT,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed','breached','cancelled')),
      reward TEXT,
      owner_user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      signed_at TEXT,
      FOREIGN KEY (owner_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS parties (
      id TEXT NOT NULL,
      contract_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('promisor','promisee','both')),
      user_id TEXT,
      signed_at TEXT,
      PRIMARY KEY (id, contract_id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clauses (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','fulfilled','breached')),
      due_date TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
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
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
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
      read INTEGER NOT NULL DEFAULT 0 CHECK(read IN (0, 1)),
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
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewed','archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trust_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL CHECK(balance_after >= 0 AND balance_after <= 100),
      reason TEXT NOT NULL,
      related_type TEXT,
      related_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  migrateSchema()
  applyIndexesAndVersion()
}

function hasColumn(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return cols.some((c) => c.name === column)
}

function migrateSchema() {
  ensureMetaTable(db)

  // —— users ——
  if (!hasColumn("users", "email")) db.exec("ALTER TABLE users ADD COLUMN email TEXT")
  if (!hasColumn("users", "password_hash")) db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT")
  if (!hasColumn("users", "phone")) db.exec("ALTER TABLE users ADD COLUMN phone TEXT")
  if (!hasColumn("users", "password_reset_token")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_token TEXT")
  }
  if (!hasColumn("users", "password_reset_expires")) {
    db.exec("ALTER TABLE users ADD COLUMN password_reset_expires TEXT")
  }
  if (!hasColumn("users", "created_at")) {
    db.exec("ALTER TABLE users ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))")
  }
  if (!hasColumn("users", "updated_at")) {
    db.exec("ALTER TABLE users ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))")
  }

  // —— goals ——
  if (!hasColumn("goals", "updated_at")) {
    db.exec("ALTER TABLE goals ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))")
  }
  if (!hasColumn("goals", "reward_claimed_at")) {
    db.exec("ALTER TABLE goals ADD COLUMN reward_claimed_at TEXT")
  }
  if (!hasColumn("goals", "abandoned_at")) {
    db.exec("ALTER TABLE goals ADD COLUMN abandoned_at TEXT")
  }

  // —— contracts ——
  if (!hasColumn("contracts", "owner_user_id")) {
    db.exec("ALTER TABLE contracts ADD COLUMN owner_user_id TEXT")
  }

  // —— parties ——
  if (!hasColumn("parties", "user_id")) {
    db.exec("ALTER TABLE parties ADD COLUMN user_id TEXT")
  }

  // —— clauses ——
  if (!hasColumn("clauses", "updated_at")) {
    db.exec("ALTER TABLE clauses ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))")
  }

  // —— pledges ——
  if (!hasColumn("pledges", "user_id")) {
    db.exec("ALTER TABLE pledges ADD COLUMN user_id TEXT")
  }
  if (!hasColumn("pledges", "updated_at")) {
    db.exec("ALTER TABLE pledges ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'))")
  }

  // —— feedback ——
  if (!hasColumn("feedback", "status")) {
    db.exec("ALTER TABLE feedback ADD COLUMN status TEXT NOT NULL DEFAULT 'new'")
  }
  if (!hasColumn("feedback", "reviewed_at")) {
    db.exec("ALTER TABLE feedback ADD COLUMN reviewed_at TEXT")
  }

  // —— trust_ledger（CREATE IF NOT EXISTS 已覆盖新库；旧库无表时补建）——
  db.exec(`
    CREATE TABLE IF NOT EXISTS trust_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      balance_after INTEGER NOT NULL CHECK(balance_after >= 0 AND balance_after <= 100),
      reason TEXT NOT NULL,
      related_type TEXT,
      related_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  // 回填契约归属：取 promisor party.id（创建时写的是 userId）
  db.exec(`
    UPDATE contracts
    SET owner_user_id = (
      SELECT p.id FROM parties p
      WHERE p.contract_id = contracts.id AND p.role = 'promisor'
      LIMIT 1
    )
    WHERE owner_user_id IS NULL
  `)

  // 回填 party.user_id：id 若对应真实用户则填入
  db.exec(`
    UPDATE parties
    SET user_id = id
    WHERE user_id IS NULL
      AND EXISTS (SELECT 1 FROM users u WHERE u.id = parties.id)
  `)
}

function applyIndexesAndVersion() {
  const version = getSchemaVersion(db)
  if (version >= SCHEMA_VERSION) return

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name ON users(name);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);

    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

    CREATE INDEX IF NOT EXISTS idx_contracts_owner ON contracts(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_parties_contract ON parties(contract_id);
    CREATE INDEX IF NOT EXISTS idx_parties_user ON parties(user_id);
    CREATE INDEX IF NOT EXISTS idx_clauses_contract ON clauses(contract_id);

    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_goal_witnesses_goal ON goal_witnesses(goal_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_goal_one_active_witness
      ON goal_witnesses(goal_id) WHERE status IN ('pending', 'confirmed');

    CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event, created_at);

    CREATE INDEX IF NOT EXISTS idx_trust_ledger_user ON trust_ledger(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_pledges_user ON pledges(user_id);
  `)

  setSchemaVersion(db, SCHEMA_VERSION)
}
