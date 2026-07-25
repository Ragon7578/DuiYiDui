import { Router } from "express"
import { v4 as uuid } from "uuid"
import { getDb } from "../db/schema.js"
import { optionalAuth } from "../middleware/auth.js"
import { rateLimit } from "../middleware/rate-limit.js"

const router = Router()

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
