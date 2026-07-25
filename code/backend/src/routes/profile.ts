import { Router } from "express"
import { getDb } from "../db/schema.js"
import type { UserProfile, Stats } from "../types"

const router = Router()

router.get("/", (req, res) => {
  const db = getDb()
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get("u1") as any
  if (!row) { res.status(404).json({ error: "User not found" }); return }
  res.json(rowToProfile(row))
})

router.patch("/", (req, res) => {
  const db = getDb()
  const { name, avatar, bio } = req.body
  const sets: string[] = []
  const params: any[] = []

  if (name !== undefined) { sets.push("name = ?"); params.push(name) }
  if (avatar !== undefined) { sets.push("avatar = ?"); params.push(avatar) }
  if (bio !== undefined) { sets.push("bio = ?"); params.push(bio) }

  if (sets.length === 0) {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get("u1") as any
    res.json(rowToProfile(row))
    return
  }

  params.push("u1")
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get("u1") as any
  res.json(rowToProfile(row))
})

router.get("/stats", (req, res) => {
  const db = getDb()
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get("u1") as any
  if (!user) { res.status(404).json({ error: "User not found" }); return }

  const goalCounts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'achieved' THEN 1 ELSE 0 END) as achieved,
      SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned
    FROM goals WHERE user_id = ?
  `).get("u1") as any

  const contractCounts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'breached' THEN 1 ELSE 0 END) as breached
    FROM contracts
  `).get() as any

  const pledgeCounts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled
    FROM pledges
  `).get() as any

  const stats: Stats = {
    totalGoals: goalCounts.total || 0,
    achievedGoals: goalCounts.achieved || 0,
    abandonedGoals: goalCounts.abandoned || 0,
    activeGoals: goalCounts.active || 0,
    totalContracts: contractCounts.total || 0,
    completedContracts: contractCounts.completed || 0,
    breachedContracts: contractCounts.breached || 0,
    activeContracts: contractCounts.active || 0,
    totalPledges: pledgeCounts.total || 0,
    fulfilledPledges: pledgeCounts.fulfilled || 0,
    trustScore: user.trust_score,
  }

  res.json(stats)
})

function rowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    trustScore: row.trust_score,
    totalGoals: row.total_goals,
    achievedGoals: row.achieved_goals,
    abandonedGoals: row.abandoned_goals,
    totalContracts: row.total_contracts,
    fulfilledContracts: row.fulfilled_contracts,
    breachedContracts: row.breached_contracts,
    bio: row.bio,
  }
}

export default router
