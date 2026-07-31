import { getDb } from "../db/schema.js"
import { adjustTrustScore } from "../db/trust.js"
import {
  type AgreementRow,
  type ClauseRow,
  type PartyRow,
  toContract,
} from "../db/mappers.js"
import type { Contract } from "../types.js"
import { resolveUserRef, type UserRef } from "./users.js"

export const AGREEMENT_FOR_MEMBER = `
  SELECT a.* FROM supervise_agreements a
  JOIN supervise_parties p ON p.agreement_id = a.id
  WHERE a.id = ? AND p.user_id = ?
`

export const LIST_AGREEMENTS_FOR_USER = `
  SELECT DISTINCT a.* FROM supervise_agreements a
  JOIN supervise_parties p ON p.agreement_id = a.id
  WHERE p.user_id = ?
  ORDER BY a.created_at DESC
`

export function enrichAgreement(row: AgreementRow): Contract {
  const db = getDb()
  const parties = db
    .prepare("SELECT * FROM supervise_parties WHERE agreement_id = ?")
    .all(row.id) as unknown as PartyRow[]
  const clauses = db
    .prepare("SELECT * FROM supervise_clauses WHERE agreement_id = ?")
    .all(row.id) as unknown as ClauseRow[]
  return toContract(row, parties, clauses)
}

export function resolveOtherParties(
  parties: { id?: string; name?: string; role?: string }[],
  currentUserId: string
): UserRef[] | { error: string } {
  const resolved: UserRef[] = []
  for (const p of parties) {
    const user = resolveUserRef(p)
    if (!user) {
      return { error: `party must be a real user (id or registered name): ${p.name || p.id || "?"}` }
    }
    if (user.userId === currentUserId) continue
    if (resolved.some((r) => r.userId === user.userId)) continue
    resolved.push(user)
  }
  if (resolved.length === 0) {
    return { error: "at least one other real user is required" }
  }
  return resolved
}

export function bumpPartyTrust(agreementId: string, kind: "fulfilled" | "breached"): void {
  const db = getDb()
  const parties = db
    .prepare("SELECT user_id FROM supervise_parties WHERE agreement_id = ?")
    .all(agreementId) as { user_id: string }[]

  const countSql =
    kind === "fulfilled"
      ? `UPDATE users SET fulfilled_contracts = fulfilled_contracts + 1,
           updated_at = datetime('now') WHERE id = ?`
      : `UPDATE users SET breached_contracts = breached_contracts + 1,
           updated_at = datetime('now') WHERE id = ?`
  const bump = db.prepare(countSql)
  const delta = kind === "fulfilled" ? 10 : -15
  const reason = kind === "fulfilled" ? "contract_fulfilled" : "contract_breached"

  for (const { user_id } of parties) {
    bump.run(user_id)
    adjustTrustScore(user_id, delta, reason, { type: "contract", id: agreementId })
  }
}

export function syncAgreementStatusFromClauses(agreementId: string): void {
  const db = getDb()
  const agreement = db
    .prepare("SELECT status FROM supervise_agreements WHERE id = ?")
    .get(agreementId) as { status: string } | undefined
  if (!agreement) return

  const clauses = db
    .prepare("SELECT status FROM supervise_clauses WHERE agreement_id = ?")
    .all(agreementId) as { status: string }[]

  if (clauses.length === 0) return

  const allDone = clauses.every((c) => c.status === "fulfilled")
  const anyBreached = clauses.some((c) => c.status === "breached")

  // 终态只结算一次，避免重复打补丁时反复加减信任分
  if (allDone) {
    if (agreement.status === "completed") return
    db.prepare(
      `UPDATE supervise_agreements SET status = 'completed', updated_at = datetime('now') WHERE id = ?`
    ).run(agreementId)
    bumpPartyTrust(agreementId, "fulfilled")
  } else if (anyBreached) {
    if (agreement.status === "breached") return
    db.prepare(
      `UPDATE supervise_agreements SET status = 'breached', updated_at = datetime('now') WHERE id = ?`
    ).run(agreementId)
    bumpPartyTrust(agreementId, "breached")
  }
}
