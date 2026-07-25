import { Router } from "express"
import { v4 as uuid } from "uuid"
import { getDb } from "../db/schema.js"
import { optionalAuth } from "../middleware/auth.js"
import { rateLimit } from "../middleware/rate-limit.js"

const router = Router()

const ALLOWED = new Set([
  "register",
  "login",
  "create_goal",
  "achieve_goal",
  "claim_reward",
  "invite_witness",
  "submit_feedback",
  "page_home",
  "page_create",
])

router.post(
  "/",
  rateLimit({ windowMs: 60_000, max: 60 }),
  optionalAuth,
  (req, res) => {
    const event = String(req.body?.event || "").trim()
    if (!ALLOWED.has(event)) {
      res.status(400).json({ error: "未知事件" })
      return
    }

    let payload: string | null = null
    if (req.body?.payload != null) {
      try {
        payload = JSON.stringify(req.body.payload).slice(0, 2000)
      } catch {
        payload = null
      }
    }

    const id = uuid()
    const userId = req.user?.userId || null
    getDb()
      .prepare(
        `INSERT INTO analytics_events (id, user_id, event, payload) VALUES (?, ?, ?, ?)`
      )
      .run(id, userId, event, payload)

    console.log(`[event] ${event} user=${userId || "anon"}`)
    res.status(204).end()
  }
)

export default router
