import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { v4 as uuid } from "uuid"
import { getDb } from "../db/schema.js"
import { optionalAuth } from "../middleware/auth.js"
import { rateLimit } from "../middleware/rate-limit.js"

const router = Router()

function requireFeedbackAdmin(req: Request, res: Response, next: NextFunction): void {
  const key = (process.env.FEEDBACK_ADMIN_KEY || "").trim()
  if (!key) {
    res.status(503).json({ error: "未配置 FEEDBACK_ADMIN_KEY，无法列出反馈" })
    return
  }
  const provided =
    String(req.headers["x-feedback-admin-key"] || "") ||
    String(req.query.key || "")
  if (provided !== key) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  next()
}

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

/** 值班读取反馈：Header `X-Feedback-Admin-Key` 或 `?key=` */
router.get(
  "/",
  rateLimit({ windowMs: 60_000, max: 30 }),
  requireFeedbackAdmin,
  (req, res) => {
    const db = getDb()
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200)
    const since = typeof req.query.since === "string" ? req.query.since.trim() : ""

    const rows = since
      ? (db
          .prepare(
            `SELECT f.id, f.user_id AS userId, f.contact, f.message, f.created_at AS createdAt,
                    u.name AS userName
             FROM feedback f
             LEFT JOIN users u ON u.id = f.user_id
             WHERE f.created_at >= ?
             ORDER BY f.created_at DESC
             LIMIT ?`
          )
          .all(since, limit) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT f.id, f.user_id AS userId, f.contact, f.message, f.created_at AS createdAt,
                    u.name AS userName
             FROM feedback f
             LEFT JOIN users u ON u.id = f.user_id
             ORDER BY f.created_at DESC
             LIMIT ?`
          )
          .all(limit) as Record<string, unknown>[])

    res.json({ items: rows, count: rows.length })
  }
)

export default router
