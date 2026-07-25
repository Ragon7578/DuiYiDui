import { Router } from "express"
import crypto from "node:crypto"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"
import { getDb } from "../db/schema.js"
import { requireAuth, signToken } from "../middleware/auth.js"
import type { UserProfile } from "../types.js"

const router = Router()
const BCRYPT_ROUNDS = 12
const USERNAME_RE = /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const APP_URL = process.env.APP_URL || "http://localhost:3000"

function normalizeUsername(value: unknown): string {
  return String(value || "").trim()
}

function rowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email || null,
    phone: row.phone || null,
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

function getProfile(userId: string): UserProfile | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as Record<string, unknown> | undefined
  return row ? rowToProfile(row) : null
}

/** 注册：仅用户名 + 密码，个人资料登录后补充 */
router.post("/register", (req, res) => {
  const db = getDb()
  const username = normalizeUsername(req.body.username ?? req.body.name)
  const password = String(req.body.password || "")
  const confirmPassword = req.body.confirmPassword != null
    ? String(req.body.confirmPassword)
    : password

  if (!username || !password) {
    res.status(400).json({ error: "请填写用户名和密码" })
    return
  }
  if (!USERNAME_RE.test(username)) {
    res.status(400).json({ error: "用户名 2-20 位，仅支持中文、字母、数字、下划线" })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: "密码至少 6 位" })
    return
  }
  if (password.length > 72) {
    res.status(400).json({ error: "密码过长" })
    return
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "两次输入的密码不一致" })
    return
  }

  const existing = db.prepare("SELECT id FROM users WHERE name = ?").get(username)
  if (existing) {
    res.status(409).json({ error: "用户名已被占用，请换一个" })
    return
  }

  const id = uuid()
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, bio)
    VALUES (?, ?, NULL, NULL, ?, ?)
  `).run(id, username, passwordHash, "")

  const token = signToken({ userId: id, username })
  res.status(201).json({ token, user: getProfile(id) })
})

router.post("/login", (req, res) => {
  const db = getDb()
  const username = normalizeUsername(req.body.username ?? req.body.name)
  const password = String(req.body.password || "")
  const invalidMsg = "用户名或密码错误"

  if (!username || !password) {
    res.status(400).json({ error: "请输入用户名和密码" })
    return
  }

  const row = db.prepare("SELECT * FROM users WHERE name = ?").get(username) as any
  if (!row?.password_hash) {
    res.status(401).json({ error: invalidMsg })
    return
  }
  if (!bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: invalidMsg })
    return
  }

  const token = signToken({ userId: row.id, username: row.name })
  res.json({ token, user: rowToProfile(row) })
})

/**
 * 忘记密码：通过已绑定的邮箱找回。
 * 试验环境不真正发邮件，返回 resetUrl 供前端展示。
 */
router.post("/forgot-password", (req, res) => {
  const db = getDb()
  const email = String(req.body.email || "").trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: "请输入有效邮箱" })
    return
  }

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any
  const generic = {
    message: "如果该邮箱已绑定账号，请使用下方链接重置密码（有效期 30 分钟）",
  }

  if (!row?.password_hash) {
    // 不暴露邮箱是否存在
    res.json(generic)
    return
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  db.prepare(`
    UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?
  `).run(token, expires, row.id)

  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  console.log(`[password-reset] ${email} → ${resetUrl}`)

  res.json({
    ...generic,
    resetUrl, // 试验功能：直接返回链接，正式环境应改为发邮件
  })
})

router.post("/reset-password", (req, res) => {
  const db = getDb()
  const token = String(req.body.token || "").trim()
  const password = String(req.body.password || "")
  const confirmPassword = req.body.confirmPassword != null
    ? String(req.body.confirmPassword)
    : password

  if (!token) {
    res.status(400).json({ error: "重置链接无效" })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: "密码至少 6 位" })
    return
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: "两次输入的密码不一致" })
    return
  }

  const row = db.prepare(`
    SELECT * FROM users WHERE password_reset_token = ?
  `).get(token) as any

  if (!row) {
    res.status(400).json({ error: "重置链接无效或已使用" })
    return
  }
  if (!row.password_reset_expires || new Date(row.password_reset_expires) < new Date()) {
    res.status(400).json({ error: "重置链接已过期，请重新申请" })
    return
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
  db.prepare(`
    UPDATE users
    SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL
    WHERE id = ?
  `).run(passwordHash, row.id)

  res.json({ message: "密码已重置，请使用新密码登录" })
})

router.get("/me", requireAuth, (req, res) => {
  const profile = getProfile(req.user!.userId)
  if (!profile) {
    res.status(404).json({ error: "用户不存在" })
    return
  }
  res.json(profile)
})

router.get("/users", requireAuth, (_req, res) => {
  const db = getDb()
  const rows = db.prepare("SELECT id, name FROM users ORDER BY name").all() as {
    id: string
    name: string
  }[]
  res.json(rows.map((r) => ({ id: r.id, name: r.name })))
})

export default router
