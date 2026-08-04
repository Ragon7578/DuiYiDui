import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"
import { ensureMetaTable, getSchemaVersion, setSchemaVersion, SCHEMA_VERSION } from "./meta.js"

function resolveDbPath(): string {
  if (process.env.DB_PATH === ":memory:") return ":memory:"
  return process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.resolve(__dirname, "..", "..", "data", "contract-spirit.db")
}

let db: DatabaseSync | undefined

export function getDb(): DatabaseSync {
  if (!db) {
    const dbPath = resolveDbPath()
    if (dbPath !== ":memory:") {
      const dir = path.dirname(dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
    db = new DatabaseSync(dbPath)
    if (process.env.NODE_ENV !== "test") {
      console.log(`[db] using ${dbPath}`)
    }
    if (dbPath !== ":memory:") {
      db.exec("PRAGMA journal_mode=WAL")
    }
    db.exec("PRAGMA foreign_keys=ON")
    db.exec("PRAGMA busy_timeout=5000")
    db.exec("PRAGMA synchronous=NORMAL")
    initSchema()
  }
  return db
}

/** 关闭连接，便于测试切换临时库 */
export function closeDb(): void {
  if (db) {
    db.close()
    db = undefined
  }
}

function tableExists(name: string): boolean {
  const row = db!
    .prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name) as { ok: number } | undefined
  return Boolean(row)
}

function hasColumn(table: string, column: string): boolean {
  const cols = db!.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return cols.some((c) => c.name === column)
}

/** SQLite ALTER 不能用非常量 DEFAULT(datetime('now'))；先可空列再回填。 */
function addTimestampColumn(table: string, column: string): void {
  if (!tableExists(table) || hasColumn(table, column)) return
  db!.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`)
  db!.exec(`UPDATE ${table} SET ${column} = datetime('now') WHERE ${column} IS NULL`)
}

function initSchema() {
  db!.exec(`
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
      supervise_unlocked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Self 域：对自己的承诺 + 奖励兑现
    CREATE TABLE IF NOT EXISTS self_commitments (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reward TEXT NOT NULL,
      reward_claimed INTEGER NOT NULL DEFAULT 0 CHECK(reward_claimed IN (0, 1)),
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active','achieved','reward_claimed','abandoned')),
      progress INTEGER NOT NULL DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      achieved_at TEXT,
      reward_claimed_at TEXT,
      abandoned_at TEXT,
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
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
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

function migrateSchema() {
  ensureMetaTable(db!)

  // —— users ——
  if (!hasColumn("users", "email")) db!.exec("ALTER TABLE users ADD COLUMN email TEXT")
  if (!hasColumn("users", "password_hash")) db!.exec("ALTER TABLE users ADD COLUMN password_hash TEXT")
  if (!hasColumn("users", "phone")) db!.exec("ALTER TABLE users ADD COLUMN phone TEXT")
  if (!hasColumn("users", "password_reset_token")) {
    db!.exec("ALTER TABLE users ADD COLUMN password_reset_token TEXT")
  }
  if (!hasColumn("users", "password_reset_expires")) {
    db!.exec("ALTER TABLE users ADD COLUMN password_reset_expires TEXT")
  }
  addTimestampColumn("users", "created_at")
  addTimestampColumn("users", "updated_at")
  if (!hasColumn("users", "supervise_unlocked_at")) {
    db!.exec("ALTER TABLE users ADD COLUMN supervise_unlocked_at TEXT")
    const required = Number(process.env.SUPERVISE_UNLOCK_REQUIRED || "3")
    db!.prepare(
      `UPDATE users SET supervise_unlocked_at = datetime('now')
       WHERE supervise_unlocked_at IS NULL
         AND (total_contracts > 0 OR achieved_goals >= ?)`
    ).run(required)
  }

  // —— self_commitments（v3 审计列）——
  if (tableExists("self_commitments")) {
    addTimestampColumn("self_commitments", "updated_at")
    if (!hasColumn("self_commitments", "reward_claimed_at")) {
      db!.exec("ALTER TABLE self_commitments ADD COLUMN reward_claimed_at TEXT")
    }
    if (!hasColumn("self_commitments", "abandoned_at")) {
      db!.exec("ALTER TABLE self_commitments ADD COLUMN abandoned_at TEXT")
    }
  }

  // —— supervise_clauses ——
  addTimestampColumn("supervise_clauses", "updated_at")

  // —— pledges ——
  if (!hasColumn("pledges", "user_id")) {
    db!.exec("ALTER TABLE pledges ADD COLUMN user_id TEXT")
  }
  addTimestampColumn("pledges", "updated_at")

  // —— feedback ——
  if (!hasColumn("feedback", "status")) {
    db!.exec("ALTER TABLE feedback ADD COLUMN status TEXT NOT NULL DEFAULT 'new'")
  }
  if (!hasColumn("feedback", "reviewed_at")) {
    db!.exec("ALTER TABLE feedback ADD COLUMN reviewed_at TEXT")
  }

  // —— trust_ledger（CREATE IF NOT EXISTS 已覆盖新库；旧库无表时补建）——
  db!.exec(`
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

  // 旧库仍可能残留 goals/contracts：补审计列后再迁入 Self/Supervise
  if (tableExists("goals")) {
    addTimestampColumn("goals", "updated_at")
    if (!hasColumn("goals", "reward_claimed_at")) {
      db!.exec("ALTER TABLE goals ADD COLUMN reward_claimed_at TEXT")
    }
    if (!hasColumn("goals", "abandoned_at")) {
      db!.exec("ALTER TABLE goals ADD COLUMN abandoned_at TEXT")
    }
  }
  if (tableExists("contracts") && !hasColumn("contracts", "owner_user_id")) {
    db!.exec("ALTER TABLE contracts ADD COLUMN owner_user_id TEXT")
  }
  if (tableExists("parties") && !hasColumn("parties", "user_id")) {
    db!.exec("ALTER TABLE parties ADD COLUMN user_id TEXT")
  }
  addTimestampColumn("clauses", "updated_at")

  if (tableExists("contracts")) {
    db!.exec(`
      UPDATE contracts
      SET owner_user_id = (
        SELECT p.id FROM parties p
        WHERE p.contract_id = contracts.id AND p.role = 'promisor'
        LIMIT 1
      )
      WHERE owner_user_id IS NULL
    `)
  }
  if (tableExists("parties")) {
    db!.exec(`
      UPDATE parties
      SET user_id = id
      WHERE user_id IS NULL
        AND EXISTS (SELECT 1 FROM users u WHERE u.id = parties.id)
    `)
  }

  migrateLegacyDomainTables()
}

function applyIndexesAndVersion() {
  const version = getSchemaVersion(db!)
  if (version >= SCHEMA_VERSION) return

  ensureIndexes()
  setSchemaVersion(db!, SCHEMA_VERSION)
}

function ensureIndexes() {
  db!.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name ON users(name);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);

    CREATE INDEX IF NOT EXISTS idx_self_commitments_owner ON self_commitments(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_self_commitments_owner_status ON self_commitments(owner_user_id, status);
    CREATE INDEX IF NOT EXISTS idx_self_commitments_deadline ON self_commitments(deadline);

    CREATE INDEX IF NOT EXISTS idx_supervise_agreements_created_by ON supervise_agreements(created_by_user_id);
    CREATE INDEX IF NOT EXISTS idx_supervise_agreements_status ON supervise_agreements(status);
    CREATE INDEX IF NOT EXISTS idx_supervise_parties_user ON supervise_parties(user_id);
    CREATE INDEX IF NOT EXISTS idx_supervise_parties_agreement ON supervise_parties(agreement_id);
    CREATE INDEX IF NOT EXISTS idx_supervise_clauses_agreement ON supervise_clauses(agreement_id);

    CREATE INDEX IF NOT EXISTS idx_supervise_witnesses_commitment ON supervise_witnesses(commitment_id);
    CREATE INDEX IF NOT EXISTS idx_supervise_witnesses_user ON supervise_witnesses(witness_user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_commitment_one_active_witness
      ON supervise_witnesses(commitment_id) WHERE status IN ('pending', 'confirmed');

    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event, created_at);

    CREATE INDEX IF NOT EXISTS idx_trust_ledger_user ON trust_ledger(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_pledges_user ON pledges(user_id);
  `)
}

/** 将旧 goals/contracts/parties/clauses/goal_witnesses 迁入 Self / Supervise 表后删除旧表 */
function migrateLegacyDomainTables() {
  const hasLegacyGoals = tableExists("goals")
  const hasLegacyContracts = tableExists("contracts")

  if (!hasLegacyGoals && !hasLegacyContracts && !tableExists("goal_witnesses")) {
    return
  }

  const selfCount = (
    db!.prepare("SELECT COUNT(*) AS n FROM self_commitments").get() as { n: number }
  ).n

  if (hasLegacyGoals && selfCount === 0) {
    db!.exec(`
      INSERT INTO self_commitments (
        id, owner_user_id, title, description, reward, reward_claimed,
        deadline, status, progress, created_at, updated_at, achieved_at,
        reward_claimed_at, abandoned_at
      )
      SELECT
        id, user_id, title, description, reward, reward_claimed,
        deadline, status, progress, created_at,
        COALESCE(updated_at, created_at), achieved_at,
        reward_claimed_at, abandoned_at
      FROM goals
    `)
    console.log("[db] migrated goals → self_commitments")
  }

  if (hasLegacyContracts) {
    const agreeCount = (
      db!.prepare("SELECT COUNT(*) AS n FROM supervise_agreements").get() as { n: number }
    ).n
    if (agreeCount === 0) {
      db!.exec(`
        INSERT INTO supervise_agreements (
          id, created_by_user_id, title, description, status, reward,
          created_at, updated_at, signed_at
        )
        SELECT
          c.id,
          COALESCE(
            c.owner_user_id,
            (SELECT COALESCE(p.user_id, p.id) FROM parties p
             WHERE p.contract_id = c.id AND COALESCE(p.user_id, p.id) IN (SELECT id FROM users)
             ORDER BY CASE p.role WHEN 'promisor' THEN 0 ELSE 1 END
             LIMIT 1),
            (SELECT id FROM users LIMIT 1)
          ),
          c.title, c.description, c.status, c.reward,
          c.created_at, c.updated_at, c.signed_at
        FROM contracts c
      `)

      if (tableExists("parties")) {
        db!.exec(`
          INSERT OR IGNORE INTO supervise_parties (
            agreement_id, user_id, display_name, role, signed_at
          )
          SELECT p.contract_id, COALESCE(p.user_id, p.id), p.name, p.role, p.signed_at
          FROM parties p
          WHERE COALESCE(p.user_id, p.id) IN (SELECT id FROM users)
        `)
      }

      if (tableExists("clauses")) {
        db!.exec(`
          INSERT INTO supervise_clauses (id, agreement_id, content, status, due_date, updated_at)
          SELECT id, contract_id, content, status, due_date, COALESCE(updated_at, datetime('now'))
          FROM clauses
        `)
      }
      console.log("[db] migrated contracts → supervise_agreements")
    }
  }

  if (tableExists("goal_witnesses")) {
    const wCount = (
      db!.prepare("SELECT COUNT(*) AS n FROM supervise_witnesses").get() as { n: number }
    ).n
    if (wCount === 0) {
      db!.exec(`
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
  db!.exec("PRAGMA foreign_keys=OFF")
  for (const name of [
    "goal_witnesses",
    "clauses",
    "parties",
    "contracts",
    "goals",
  ]) {
    if (tableExists(name)) {
      db!.exec(`DROP TABLE IF EXISTS ${name}`)
      console.log(`[db] dropped legacy table ${name}`)
    }
  }
  db!.exec("PRAGMA foreign_keys=ON")
}
