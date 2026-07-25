import { Router } from "express"
import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import type { Pledge, CreatePledgeInput } from "../types.js"

const router = Router()

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM pledges WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user!.userId) as any[]
  res.json(rows.map(rowToPledge))
})

router.get("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const row = db.prepare(`
    SELECT * FROM pledges WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
  if (!row) { res.status(404).json({ error: "Pledge not found" }); return }
  res.json(rowToPledge(row))
})

router.post("/", requireAuth, (req, res) => {
  const db = getDb()
  const input = req.body as CreatePledgeInput
  if (!input.title) { res.status(400).json({ error: "title is required" }); return }

  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(req.user!.userId) as { name: string }
  const id = uuid()
  db.prepare(`
    INSERT INTO pledges (id, title, description, maker, deadline, status, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, datetime('now'))
  `).run(
    id,
    input.title,
    input.description || "",
    input.maker || user.name,
    input.deadline || null,
    req.user!.userId
  )

  const row = db.prepare("SELECT * FROM pledges WHERE id = ?").get(id) as any
  res.status(201).json(rowToPledge(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT * FROM pledges WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
  if (!existing) { res.status(404).json({ error: "Pledge not found" }); return }

  const { title, description, status, deadline } = req.body
  const sets: string[] = []
  const params: any[] = []

  if (title !== undefined) { sets.push("title = ?"); params.push(title) }
  if (description !== undefined) { sets.push("description = ?"); params.push(description) }
  if (status !== undefined) { sets.push("status = ?"); params.push(status) }
  if (deadline !== undefined) { sets.push("deadline = ?"); params.push(deadline) }

  if (sets.length === 0) { res.json(rowToPledge(existing)); return }

  params.push(param(req.params.id))
  db.prepare(`UPDATE pledges SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  const row = db.prepare("SELECT * FROM pledges WHERE id = ?").get(param(req.params.id)) as any
  res.json(rowToPledge(row))
})

router.delete("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT * FROM pledges WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
  if (!existing) { res.status(404).json({ error: "Pledge not found" }); return }
  db.prepare("DELETE FROM pledges WHERE id = ?").run(param(req.params.id))
  res.status(204).send()
})

function rowToPledge(row: any): Pledge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    maker: row.maker,
    deadline: row.deadline,
    status: row.status,
    createdAt: row.created_at,
  }
}

export default router
