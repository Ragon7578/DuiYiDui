import { Router } from "express"
import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import { createNotification, notifyGoalAchieved } from "../services/notifications.js"
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalWitness } from "../types.js"

const router = Router()

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user!.userId) as any[]
  res.json(rows.map(rowToGoal))
})

router.get("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const row = db.prepare(`
    SELECT * FROM goals WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
  if (!row) { res.status(404).json({ error: "Goal not found" }); return }
  res.json(rowToGoal(row))
})

router.post("/", requireAuth, (req, res) => {
  const db = getDb()
  const input = req.body as CreateGoalInput
  if (!input.title || !input.reward) {
    res.status(400).json({ error: "title and reward are required" })
    return
  }
  const id = uuid()
  const userId = req.user!.userId
  db.prepare(`
    INSERT INTO goals (id, title, description, reward, deadline, status, progress, user_id)
    VALUES (?, ?, ?, ?, ?, 'active', 0, ?)
  `).run(id, input.title, input.description || null, input.reward, input.deadline || null, userId)
  db.prepare("UPDATE users SET total_goals = total_goals + 1 WHERE id = ?").run(userId)

  if (input.witnessUserId) {
    const witness = db.prepare("SELECT name FROM users WHERE id = ?").get(input.witnessUserId) as { name: string } | undefined
    if (witness) {
      addWitness(id, input.witnessUserId, witness.name, userId)
    }
  }

  const row = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as any
  res.status(201).json(rowToGoal(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT * FROM goals WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
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

  params.push(param(req.params.id))
  db.prepare(`UPDATE goals SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  const becameAchieved =
    (input.status === "achieved" && existing.status !== "achieved") ||
    (input.progress === 100 && existing.progress !== 100)

  if (becameAchieved) {
    db.prepare(`
      UPDATE users SET achieved_goals = achieved_goals + 1, trust_score = MIN(100, trust_score + 5)
      WHERE id = ?
    `).run(existing.user_id)
    notifyGoalAchieved(existing.user_id, existing.title, existing.id)
    notifyWitnesses(existing.id, existing.title, "achieved")
  }

  if (input.status === "abandoned" && existing.status !== "abandoned") {
    db.prepare(`
      UPDATE users SET abandoned_goals = abandoned_goals + 1, trust_score = MAX(0, trust_score - 5)
      WHERE id = ?
    `).run(existing.user_id)
  }

  const updated = db.prepare("SELECT * FROM goals WHERE id = ?").get(param(req.params.id)) as any
  res.json(rowToGoal(updated))
})

router.post("/:id/claim-reward", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT * FROM goals WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any

  if (!existing) { res.status(404).json({ error: "Goal not found" }); return }
  if (existing.status !== "achieved" && existing.status !== "reward_claimed") {
    res.status(400).json({ error: "Goal must be achieved before claiming reward" })
    return
  }
  if (existing.reward_claimed) {
    res.status(400).json({ error: "Reward already claimed" })
    return
  }

  db.prepare(`
    UPDATE goals SET reward_claimed = 1, status = 'reward_claimed' WHERE id = ?
  `).run(param(req.params.id))

  createNotification(
    req.user!.userId,
    "reward_ready",
    "奖励已兑现",
    `你已兑现目标「${existing.title}」的奖励：${existing.reward}`,
    existing.id
  )

  const updated = db.prepare("SELECT * FROM goals WHERE id = ?").get(param(req.params.id)) as any
  res.json(rowToGoal(updated))
})

router.get("/:id/witnesses", requireAuth, (req, res) => {
  const db = getDb()
  const goal = db.prepare(`
    SELECT id FROM goals WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId)
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return }

  const rows = db.prepare(`
    SELECT * FROM goal_witnesses WHERE goal_id = ? ORDER BY invited_at DESC
  `).all(param(req.params.id)) as any[]
  res.json(rows.map(rowToWitness))
})

router.post("/:id/witnesses", requireAuth, (req, res) => {
  const db = getDb()
  const goal = db.prepare(`
    SELECT * FROM goals WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return }

  const { witnessUserId, witnessName } = req.body
  if (!witnessUserId && !witnessName) {
    res.status(400).json({ error: "witnessUserId or witnessName is required" })
    return
  }

  let name = witnessName
  if (witnessUserId) {
    const user = db.prepare("SELECT name FROM users WHERE id = ?").get(witnessUserId) as { name: string } | undefined
    if (!user) { res.status(404).json({ error: "Witness user not found" }); return }
    name = user.name
  }

  const witness = addWitness(param(req.params.id), witnessUserId || null, name, req.user!.userId)
  res.status(201).json(witness)
})

router.patch("/:id/witnesses/:witnessId", requireAuth, (req, res) => {
  const db = getDb()
  const witness = db.prepare(`
    SELECT gw.* FROM goal_witnesses gw
    JOIN goals g ON g.id = gw.goal_id
    WHERE gw.id = ? AND gw.goal_id = ? AND (g.user_id = ? OR gw.witness_user_id = ?)
  `).get(param(req.params.witnessId), param(req.params.id), req.user!.userId, req.user!.userId) as any

  if (!witness) { res.status(404).json({ error: "Witness not found" }); return }

  const { status } = req.body
  if (!["confirmed", "declined"].includes(status)) {
    res.status(400).json({ error: "status must be confirmed or declined" })
    return
  }

  db.prepare(`
    UPDATE goal_witnesses SET status = ?, confirmed_at = datetime('now') WHERE id = ?
  `).run(status, param(req.params.witnessId))

  if (status === "confirmed") {
    const goal = db.prepare("SELECT title, user_id FROM goals WHERE id = ?").get(param(req.params.id)) as any
    createNotification(
      goal.user_id,
      "witness_confirmed",
      "见证人已确认",
      `${witness.witness_name} 已确认见证你的目标「${goal.title}」`,
      param(req.params.id)
    )
  }

  const updated = db.prepare("SELECT * FROM goal_witnesses WHERE id = ?").get(param(req.params.witnessId)) as any
  res.json(rowToWitness(updated))
})

router.delete("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT * FROM goals WHERE id = ? AND user_id = ?
  `).get(param(req.params.id), req.user!.userId) as any
  if (!existing) { res.status(404).json({ error: "Goal not found" }); return }
  db.prepare("DELETE FROM goals WHERE id = ?").run(param(req.params.id))
  db.prepare("UPDATE users SET total_goals = MAX(0, total_goals - 1) WHERE id = ?").run(existing.user_id)
  res.status(204).send()
})

function addWitness(
  goalId: string,
  witnessUserId: string | null,
  witnessName: string,
  ownerUserId: string
): GoalWitness {
  const db = getDb()
  const id = uuid()
  db.prepare(`
    INSERT INTO goal_witnesses (id, goal_id, witness_user_id, witness_name)
    VALUES (?, ?, ?, ?)
  `).run(id, goalId, witnessUserId, witnessName)

  if (witnessUserId) {
    const goal = db.prepare("SELECT title FROM goals WHERE id = ?").get(goalId) as { title: string }
    createNotification(
      witnessUserId,
      "witness_invite",
      "见证邀请",
      `你被邀请见证目标「${goal.title}」`,
      goalId
    )
  }

  const row = db.prepare("SELECT * FROM goal_witnesses WHERE id = ?").get(id) as any
  return rowToWitness(row)
}

function notifyWitnesses(goalId: string, goalTitle: string, event: string): void {
  const db = getDb()
  const witnesses = db.prepare(`
    SELECT witness_user_id, witness_name FROM goal_witnesses
    WHERE goal_id = ? AND witness_user_id IS NOT NULL AND status = 'confirmed'
  `).all(goalId) as { witness_user_id: string; witness_name: string }[]

  for (const w of witnesses) {
    createNotification(
      w.witness_user_id,
      "goal_achieved",
      "见证目标已达成",
      `你见证的目标「${goalTitle}」已${event === "achieved" ? "达成" : "更新"}！`,
      goalId
    )
  }
}

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

function rowToWitness(row: any): GoalWitness {
  return {
    id: row.id,
    goalId: row.goal_id,
    witnessUserId: row.witness_user_id,
    witnessName: row.witness_name,
    status: row.status,
    invitedAt: row.invited_at,
    confirmedAt: row.confirmed_at,
  }
}

export default router
