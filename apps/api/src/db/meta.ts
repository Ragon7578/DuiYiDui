import type { DatabaseSync } from "node:sqlite"

/** 逻辑 schema 版本；每次增量迁移后递增 */
export const SCHEMA_VERSION = 3

const META_KEY = "schema_version"

export function ensureMetaTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

export function getSchemaVersion(db: DatabaseSync): number {
  ensureMetaTable(db)
  const row = db.prepare("SELECT value FROM schema_meta WHERE key = ?").get(META_KEY) as
    | { value: string }
    | undefined
  return row ? Number(row.value) || 0 : 0
}

export function setSchemaVersion(db: DatabaseSync, version: number): void {
  ensureMetaTable(db)
  db.prepare(`
    INSERT INTO schema_meta (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(META_KEY, String(version))
}
