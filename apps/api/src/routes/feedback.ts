import { Router, type Request, type Response, type NextFunction } from "express"
import { v4 as uuid } from "uuid"
import { getDb } from "../db/schema.js"
import { optionalAuth } from "../middleware/auth.js"
import { rateLimit } from "../middleware/rate-limit.js"

const router = Router()

function requireFeedbackOps(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.FEEDBACK_OPS_KEY?.trim()
  if (!expected) {
    res.status(503).json({
      error: "FEEDBACK_OPS_KEY is not configured — cannot list feedback",
    })
    return
  }
  const got = req.header("x-feedback-ops-key")?.trim()
  if (!got || got !== expected) {
    res.status(401).json({ error: "invalid or missing X-Feedback-Ops-Key" })
    return
  }
  next()
}

/** Ops：列出反馈（征集整理用）。需请求头 X-Feedback-Ops-Key = FEEDBACK_OPS_KEY */
router.get("/", requireFeedbackOps, (req, res) => {
  const db = getDb()
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100))
  const since = typeof req.query.since === "string" ? req.query.since.trim() : ""

  const rows = since
    ? (db
        .prepare(
          `
      SELECT f.id, f.user_id, f.contact, f.message, f.created_at, u.name AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      WHERE f.created_at >= ?
      ORDER BY f.created_at DESC
      LIMIT ?
    `
        )
        .all(since, limit) as any[])
    : (db
        .prepare(
          `
      SELECT f.id, f.user_id, f.contact, f.message, f.created_at, u.name AS user_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      ORDER BY f.created_at DESC
      LIMIT ?
    `
        )
        .all(limit) as any[])

  res.json({
    count: rows.length,
    items: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || null,
      contact: r.contact,
      message: r.message,
      createdAt: r.created_at,
    })),
  })
})

router.post(
  "/",
  rateLimit({ windowMs: 60_000, max: 8 }),
  optionalAuth,
  (req, res) => {
    const message = String(req.body?.message || "").trim()
    const contact = String(req.body?.contact || "").trim() || null

    if (message.length < 5) {
      res.status(400).json({ error: "反馈内容至少 5 个字" })
      return
    }
    if (message.length > 2000) {
      res.status(400).json({ error: "反馈内容过长" })
      return
    }

    const id = uuid()
    const userId = req.user?.userId || null
    getDb()
      .prepare(
        `INSERT INTO feedback (id, user_id, contact, message) VALUES (?, ?, ?, ?)`
      )
      .run(id, userId, contact, message)

    console.log(`[feedback] ${id} user=${userId || "anon"} ${message.slice(0, 80)}`)

    res.status(201).json({
      id,
      message: "感谢反馈。我们会认真阅读，用于改进初版体验。",
    })
  }
)

export default router
