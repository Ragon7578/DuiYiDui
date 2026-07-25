import { Router } from "express"
import { getDb } from "../db/schema.js"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import { checkDeadlineNotifications } from "../services/notifications.js"
import type { Notification } from "../types.js"

const router = Router()

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  checkDeadlineNotifications(req.user!.userId)

  const rows = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user!.userId) as any[]

  res.json(rows.map(rowToNotification))
})

router.get("/unread-count", requireAuth, (req, res) => {
  const db = getDb()
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND read = 0
  `).get(req.user!.userId) as { count: number }
  res.json({ count: row.count })
})

router.patch("/:id/read", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT * FROM notifications WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any

  if (!existing) {
    res.status(404).json({ error: "Notification not found" })
    return
  }

  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(param(req.params.id))
  res.json(rowToNotification({ ...existing, read: 1 }))
})

router.patch("/read-all", requireAuth, (req, res) => {
  const db = getDb()
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.user!.userId)
  res.json({ success: true })
})

function rowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: !!row.read,
    relatedId: row.related_id,
    createdAt: row.created_at,
  }
}

export default router
