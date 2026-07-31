import fs from "node:fs"
import path from "node:path"
import { getDb } from "./schema.js"
import { getSchemaVersion, SCHEMA_VERSION } from "./meta.js"

export type DbHealth = {
  ok: boolean
  integrity: string
  schemaVersion: number
  expectedSchemaVersion: number
  journalMode: string
  path: string
}

export type DbStats = {
  schemaVersion: number
  tables: Record<string, number>
}

function resolveDbPath(): string {
  return process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.resolve(__dirname, "..", "..", "data", "contract-spirit.db")
}

/** 在线备份：VACUUM INTO 生成一致快照（无需 backup() API） */
export function backupDatabase(destPath: string): string {
  const srcPath = resolveDbPath()
  if (!fs.existsSync(srcPath)) {
    throw new Error(`数据库不存在: ${srcPath}`)
  }
  const dest = path.resolve(destPath)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
  }

  const db = getDb()
  const escaped = dest.replace(/'/g, "''")
  db.exec(`VACUUM INTO '${escaped}'`)
  return dest
}

export function checkDbHealth(): DbHealth {
  const db = getDb()
  const integrityRow = db.prepare("PRAGMA integrity_check").get() as {
    integrity_check: string
  }
  const journalRow = db.prepare("PRAGMA journal_mode").get() as { journal_mode: string }
  const schemaVersion = getSchemaVersion(db)
  const integrity = integrityRow?.integrity_check ?? "unknown"

  return {
    ok: integrity === "ok" && schemaVersion >= SCHEMA_VERSION,
    integrity,
    schemaVersion,
    expectedSchemaVersion: SCHEMA_VERSION,
    journalMode: journalRow?.journal_mode ?? "unknown",
    path: resolveDbPath(),
  }
}

export function getDbStats(): DbStats {
  const db = getDb()
  const tables = [
    "users",
    "self_commitments",
    "supervise_agreements",
    "supervise_parties",
    "supervise_clauses",
    "supervise_witnesses",
    "pledges",
    "notifications",
    "feedback",
    "analytics_events",
  ]
  const counts: Record<string, number> = {}
  for (const name of tables) {
    const row = db.prepare(`SELECT COUNT(*) AS c FROM ${name}`).get() as { c: number }
    counts[name] = row?.c ?? 0
  }
  return { schemaVersion: getSchemaVersion(db), tables: counts }
}
