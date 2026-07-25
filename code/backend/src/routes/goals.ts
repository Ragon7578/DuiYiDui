import { Router } from "express"
import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"
import type { Goal, CreateGoalInput, UpdateGoalInput } from "../types"

const router = Router()

router.get("/", (req, res) => {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all() as any[]
  const goals: Goal[] = rows.map(rowToGoal)
  res.json(goals)
})

router.get("/:id", (req, res) => {
  const db = getDb()
  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id) as any
  if (!row) { res.status(404).json({ error: "Goal not found" }); return }
  res.json(rowToGoal(row))
})

router.post("/", (req, res) => {
  const db = getDb()
  const input = req.body as CreateGoalInput
  if (!input.title || !input.reward) {
    res.status(400).json({ error: "title and reward are required" })
    return
  }
  const id = uuid()
  const userId = input.userId || "u1"
  db.prepare(`
    INSERT INTO goals (id, title, description, reward, deadline, status, progress, user_id)
    VALUES (?, ?, ?, ?, ?, 'active', 0, ?)
  `).run(id, input.title, input.description || null, input.reward, input.deadline || null, userId)
  db.prepare("UPDATE users SET total_goals = total_goals + 1 WHERE id = ?").run(userId)
  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as any
  res.status(201).json(rowToGoal(row))
})

router.patch("/:id", (req, res) => {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id) as any
  if (!existing) { res.status(404).json({ error: "Goal not found" }); return }

  const input = req.body as UpdateGoalInput
  const sets: string[] = []
  const params: any[] = []

  if (input.title !== undefined) { sets.push("title = ?"); params.push(input.title) }
  if (input.description !== undefined) { sets.push("description = ?"); params.push(input.description) }
  if (input.reward !== undefined) { sets.push("reward = ?"); params.push(input.reward) }
  if (input.deadline !== undefined) { sets.push("deadline = ?"); params.push(input.deadline) }
  if (input.status !== undefined) { sets.push("status = ?"); params.push(input.status) }
  if (input.progress !== undefined) { sets.push("progress = ?"); params.push(input.progress) }
  if (input.rewardClaimed !== undefined) { sets.push("reward_claimed = ?"); params.push(input.rewardClaimed ? 1 : 0) }

  if (input.status === "achieved" && existing.status !== "achieved") {
    sets.push("achieved_at = datetime('now')")
  }

  if (input.progress !== undefined && input.progress === 100 && existing.progress !== 100) {
    sets.push("status = 'achieved'")
    sets.push("achieved_at = datetime('now')")
  }

  if (sets.length === 0) { res.json(rowToGoal(existing)); return }

  params.push(req.params.id)
  db.prepare(`UPDATE goals SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  if (input.status === "achieved" && existing.status !== "achieved") {
    db.prepare("UPDATE users SET achieved_goals = achieved_goals + 1, trust_score = MIN(100, trust_score + 5) WHERE id = ?").run(existing.user_id)
  }
  if (input.status === "abandoned" && existing.status !== "abandoned") {
    db.prepare("UPDATE users SET abandoned_goals = abandoned_goals + 1, trust_score = MAX(0, trust_score - 5) WHERE id = ?").run(existing.user_id)
  }

  const updated = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id) as any
  res.json(rowToGoal(updated))
})

router.delete("/:id", (req, res) => {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM goals WHERE id = ?").get(req.params.id) as any
  if (!existing) { res.status(404).json({ error: "Goal not found" }); return }
  db.prepare("DELETE FROM goals WHERE id = ?").run(req.params.id)
  db.prepare("UPDATE users SET total_goals = MAX(0, total_goals - 1) WHERE id = ?").run(existing.user_id)
  res.status(204).send()
})

function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    reward: row.reward,
    rewardClaimed: !!row.reward_claimed,
    deadline: row.deadline,
    status: row.status,
    progress: row.progress,
    createdAt: row.created_at,
    achievedAt: row.achieved_at,
    userId: row.user_id,
  }
}

export default router
