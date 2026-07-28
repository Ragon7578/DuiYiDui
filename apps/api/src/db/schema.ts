import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"

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
    initSchema()
  }
  return db
}

function tableExists(name: string): boolean {
  const row = db
    .prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name) as { ok: number } | undefined
  return Boolean(row)
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

    -- Self 域：对自己的承诺 + 奖励兑现
    CREATE TABLE IF NOT EXISTS self_commitments (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reward TEXT NOT NULL,
      reward_claimed INTEGER NOT NULL DEFAULT 0,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active','achieved','reward_claimed','abandoned')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      achieved_at TEXT,
      FOREIGN KEY (owner_user_id) REFERENCES users(id)
    );

    -- Supervise 域：多方约定（参与方必须是真实用户）
    CREATE TABLE IF NOT EXISTS supervise_agreements (
      id TEXT PRIMARY KEY,
      created_by_user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft','active','completed','breached','cancelled')),
      reward TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      signed_at TEXT,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS supervise_parties (
      agreement_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('promisor','promisee','both')),
      signed_at TEXT,
      PRIMARY KEY (agreement_id, user_id),
      FOREIGN KEY (agreement_id) REFERENCES supervise_agreements(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS supervise_clauses (
      id TEXT PRIMARY KEY,
      agreement_id TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','fulfilled','breached')),
      due_date TEXT,
      FOREIGN KEY (agreement_id) REFERENCES supervise_agreements(id) ON DELETE CASCADE
    );

    -- 监督侧见证：盯「我的」承诺；见证人必须是真实用户
    CREATE TABLE IF NOT EXISTS supervise_witnesses (
      id TEXT PRIMARY KEY,
      commitment_id TEXT NOT NULL,
      witness_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','confirmed','declined')),
      invited_at TEXT NOT NULL DEFAULT (datetime('now')),
      confirmed_at TEXT,
      FOREIGN KEY (commitment_id) REFERENCES self_commitments(id) ON DELETE CASCADE,
      FOREIGN KEY (witness_user_id) REFERENCES users(id)
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
}

function migrateSchema() {
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

  migrateLegacyDomainTables()
}

/** 将旧 goals/contracts/parties/clauses/goal_witnesses 迁入 Self / Supervise 表后删除旧表 */
function migrateLegacyDomainTables() {
  const hasLegacyGoals = tableExists("goals")
  const hasLegacyContracts = tableExists("contracts")

  if (!hasLegacyGoals && !hasLegacyContracts && !tableExists("goal_witnesses")) {
    return
  }

  const selfCount = (
    db.prepare("SELECT COUNT(*) AS n FROM self_commitments").get() as { n: number }
  ).n

  if (hasLegacyGoals && selfCount === 0) {
    db.exec(`
      INSERT INTO self_commitments (
        id, owner_user_id, title, description, reward, reward_claimed,
        deadline, status, progress, created_at, achieved_at
      )
      SELECT
        id, user_id, title, description, reward, reward_claimed,
        deadline, status, progress, created_at, achieved_at
      FROM goals
    `)
    console.log("[db] migrated goals → self_commitments")
  }

  if (hasLegacyContracts) {
    const agreeCount = (
      db.prepare("SELECT COUNT(*) AS n FROM supervise_agreements").get() as { n: number }
    ).n
    if (agreeCount === 0) {
      db.exec(`
        INSERT INTO supervise_agreements (
          id, created_by_user_id, title, description, status, reward,
          created_at, updated_at, signed_at
        )
        SELECT
          c.id,
          COALESCE(
            (SELECT p.id FROM parties p
             WHERE p.contract_id = c.id AND p.id IN (SELECT id FROM users)
             ORDER BY CASE p.role WHEN 'promisor' THEN 0 ELSE 1 END
             LIMIT 1),
            (SELECT id FROM users LIMIT 1)
          ),
          c.title, c.description, c.status, c.reward,
          c.created_at, c.updated_at, c.signed_at
        FROM contracts c
      `)

      if (tableExists("parties")) {
        db.exec(`
          INSERT OR IGNORE INTO supervise_parties (
            agreement_id, user_id, display_name, role, signed_at
          )
          SELECT p.contract_id, p.id, p.name, p.role, p.signed_at
          FROM parties p
          WHERE p.id IN (SELECT id FROM users)
        `)
      }

      if (tableExists("clauses")) {
        db.exec(`
          INSERT INTO supervise_clauses (id, agreement_id, content, status, due_date)
          SELECT id, contract_id, content, status, due_date FROM clauses
        `)
      }
      console.log("[db] migrated contracts → supervise_agreements")
    }
  }

  if (tableExists("goal_witnesses")) {
    const wCount = (
      db.prepare("SELECT COUNT(*) AS n FROM supervise_witnesses").get() as { n: number }
    ).n
    if (wCount === 0) {
      db.exec(`
        INSERT INTO supervise_witnesses (
          id, commitment_id, witness_user_id, status, invited_at, confirmed_at
        )
        SELECT
          id, goal_id, witness_user_id, status, invited_at, confirmed_at
        FROM goal_witnesses
        WHERE witness_user_id IS NOT NULL
          AND witness_user_id IN (SELECT id FROM users)
          AND goal_id IN (SELECT id FROM self_commitments)
      `)
      console.log("[db] migrated goal_witnesses → supervise_witnesses")
    }
  }

  // 旧表不再使用；DROP 顺序注意 FK
  db.exec("PRAGMA foreign_keys=OFF")
  for (const name of [
    "goal_witnesses",
    "clauses",
    "parties",
    "contracts",
    "goals",
  ]) {
    if (tableExists(name)) {
      db.exec(`DROP TABLE IF EXISTS ${name}`)
      console.log(`[db] dropped legacy table ${name}`)
    }
  }
  db.exec("PRAGMA foreign_keys=ON")
}
