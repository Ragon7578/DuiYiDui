import { getDb } from "../db/schema.js"
import { SUPERVISE_UNLOCK_REQUIRED } from "../config/roles.js"
import type { UserProfile } from "../types.js"

export interface SuperviseUnlockStatus {
  unlocked: boolean
  required: number
  progress: number
  eligible: boolean
  unlockedAt: string | null
}

type UserRow = {
  achieved_goals: number
  supervise_unlocked_at: string | null
}

export function getSuperviseUnlockStatusFromRow(row: UserRow): SuperviseUnlockStatus {
  const progress = row.achieved_goals ?? 0
  const unlocked = Boolean(row.supervise_unlocked_at)
  const required = SUPERVISE_UNLOCK_REQUIRED
  return {
    unlocked,
    required,
    progress,
    eligible: !unlocked && progress >= required,
    unlockedAt: row.supervise_unlocked_at,
  }
}

export function getSuperviseUnlockStatus(userId: string): SuperviseUnlockStatus {
  const row = getDb()
    .prepare("SELECT achieved_goals, supervise_unlocked_at FROM users WHERE id = ?")
    .get(userId) as UserRow | undefined
  if (!row) {
    return {
      unlocked: false,
      required: SUPERVISE_UNLOCK_REQUIRED,
      progress: 0,
      eligible: false,
      unlockedAt: null,
    }
  }
  return getSuperviseUnlockStatusFromRow(row)
}

export function applySuperviseUnlock(
  userId: string
): { ok: true; status: SuperviseUnlockStatus } | { ok: false; status: SuperviseUnlockStatus } {
  const status = getSuperviseUnlockStatus(userId)
  if (status.unlocked) return { ok: true, status }
  if (!status.eligible) return { ok: false, status }
  getDb()
    .prepare("UPDATE users SET supervise_unlocked_at = datetime('now') WHERE id = ?")
    .run(userId)
  return { ok: true, status: getSuperviseUnlockStatus(userId) }
}

export function enrichUserProfile(row: Record<string, unknown>): UserProfile {
  const unlock = getSuperviseUnlockStatusFromRow({
    achieved_goals: Number(row.achieved_goals ?? 0),
    supervise_unlocked_at: (row.supervise_unlocked_at as string | null) ?? null,
  })
  return {
    id: String(row.id),
    name: String(row.name),
    email: (row.email as string | null) || null,
    phone: (row.phone as string | null) || null,
    avatar: (row.avatar as string | null) || null,
    trustScore: Number(row.trust_score ?? 50),
    totalGoals: Number(row.total_goals ?? 0),
    achievedGoals: Number(row.achieved_goals ?? 0),
    abandonedGoals: Number(row.abandoned_goals ?? 0),
    totalContracts: Number(row.total_contracts ?? 0),
    fulfilledContracts: Number(row.fulfilled_contracts ?? 0),
    breachedContracts: Number(row.breached_contracts ?? 0),
    bio: String(row.bio ?? ""),
    superviseUnlocked: unlock.unlocked,
    superviseUnlockRequired: unlock.required,
    superviseUnlockProgress: unlock.progress,
    superviseUnlockEligible: unlock.eligible,
    superviseUnlockedAt: unlock.unlockedAt,
  }
}
