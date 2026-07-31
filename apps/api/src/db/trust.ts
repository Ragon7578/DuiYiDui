import { v4 as uuid } from "uuid"
import type { DatabaseSync } from "node:sqlite"
import { getDb } from "./schema.js"

export type TrustReason =
  | "goal_achieved"
  | "goal_abandoned"
  | "witness_goal_achieved"
  | "contract_fulfilled"
  | "contract_breached"

/**
 * 调整信任分并写入履约流水（trust_ledger）。
 * 分数钳制在 0～100。
 */
export function adjustTrustScore(
  userId: string,
  delta: number,
  reason: TrustReason,
  related?: { type: string; id: string },
  db: DatabaseSync = getDb()
): number {
  const row = db.prepare("SELECT trust_score FROM users WHERE id = ?").get(userId) as
    | { trust_score: number }
    | undefined
  if (!row) return 0

  const before = row.trust_score
  const after = Math.max(0, Math.min(100, before + delta))
  const applied = after - before
  if (applied === 0 && delta !== 0) {
    // 已到边界仍记 0 变动流水，便于审计「触顶/触底」
  }

  db.prepare("UPDATE users SET trust_score = ?, updated_at = datetime('now') WHERE id = ?").run(
    after,
    userId
  )

  db.prepare(`
    INSERT INTO trust_ledger (id, user_id, delta, balance_after, reason, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid(),
    userId,
    applied,
    after,
    reason,
    related?.type ?? null,
    related?.id ?? null
  )

  return after
}
