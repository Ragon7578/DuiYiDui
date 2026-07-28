import { Router } from "express"
import { getDb } from "../db/schema.js"
import { requireAuth } from "../middleware/auth.js"
import { checkDeadlineNotifications } from "../services/notifications.js"
import type { UserProfile, Stats } from "../types.js"
import { enrichUserProfile, applySuperviseUnlock } from "../services/user-profile.js"

const router = Router()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^1\d{10}$|^(\+?\d{6,15})$/

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return enrichUserProfile(row)
}

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.userId) as any
  if (!row) { res.status(404).json({ error: "User not found" }); return }
  res.json(rowToProfile(row))
})

/** 登录后补充个人资料：邮箱、手机、简介等 */
router.patch("/", requireAuth, (req, res) => {
  const db = getDb()
  const userId = req.user!.userId
  const { avatar, bio, email, phone } = req.body
  const sets: string[] = []
  const params: any[] = []

  if (avatar !== undefined) { sets.push("avatar = ?"); params.push(avatar || null) }
  if (bio !== undefined) { sets.push("bio = ?"); params.push(String(bio)) }

  if (email !== undefined) {
    const value = email === null || email === "" ? null : String(email).trim().toLowerCase()
    if (value && !EMAIL_RE.test(value)) {
      res.status(400).json({ error: "邮箱格式不正确" })
      return
    }
    if (value) {
      const taken = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(value, userId)
      if (taken) {
        res.status(409).json({ error: "该邮箱已被其他账号绑定" })
        return
      }
    }
    sets.push("email = ?")
    params.push(value)
  }

  if (phone !== undefined) {
    const value = phone === null || phone === "" ? null : String(phone).trim()
    if (value && !PHONE_RE.test(value)) {
      res.status(400).json({ error: "手机号格式不正确" })
      return
    }
    sets.push("phone = ?")
    params.push(value)
  }

  if (sets.length === 0) {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any
    res.json(rowToProfile(row))
    return
  }

  params.push(userId)
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any
  res.json(rowToProfile(row))
})

router.get("/stats", requireAuth, (req, res) => {
  const db = getDb()
  const userId = req.user!.userId
  checkDeadlineNotifications(userId)

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any
  if (!user) { res.status(404).json({ error: "User not found" }); return }

  const goalCounts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'achieved' OR status = 'reward_claimed' THEN 1 ELSE 0 END) as achieved,
      SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned
    FROM self_commitments WHERE owner_user_id = ?
  `).get(userId) as any

  const contractCounts = db.prepare(`
    SELECT
      COUNT(DISTINCT a.id) as total,
      SUM(CASE WHEN a.status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN a.status = 'breached' THEN 1 ELSE 0 END) as breached
    FROM supervise_agreements a
    JOIN supervise_parties p ON p.agreement_id = a.id
    WHERE p.user_id = ?
  `).get(userId) as any

  const pledgeCounts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) as fulfilled
    FROM pledges WHERE user_id = ?
  `).get(userId) as any

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

/** 申请解锁他人（监督）角色：须先达成足够数量的给自己的项目 */
router.post("/unlock-supervise", requireAuth, (req, res) => {
  const result = applySuperviseUnlock(req.user!.userId)
  if (!result.ok) {
    res.status(400).json({
      error: `还需完成 ${result.status.required - result.status.progress} 个给自己的项目才能申请解锁`,
      code: "SUPERVISE_UNLOCK_INELIGIBLE",
      required: result.status.required,
      progress: result.status.progress,
      eligible: false,
    })
    return
  }
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(req.user!.userId) as Record<string, unknown>
  res.json({
    message: "他人角色已解锁，可以创建给别人的项目",
    user: rowToProfile(row),
  })
})

export default router
