import { Router } from "express"
import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import { createNotification, notifyGoalAchieved } from "../services/notifications.js"
import type { Goal, CreateGoalInput, UpdateGoalInput, GoalWitness } from "../types.js"

const router = Router()

/** Self 域：自我承诺（API 路径仍为 /api/goals，响应形状兼容前端 Goal） */

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  const rows = db
    .prepare(
      `
    SELECT * FROM self_commitments WHERE owner_user_id = ? ORDER BY created_at DESC
  `
    )
    .all(req.user!.userId) as any[]
  res.json(rows.map(rowToGoal))
})

router.get("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const row = db
    .prepare(
      `
    SELECT * FROM self_commitments WHERE id = ? AND owner_user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!row) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
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
  db.prepare(
    `
    INSERT INTO self_commitments (id, title, description, reward, deadline, status, progress, owner_user_id)
    VALUES (?, ?, ?, ?, ?, 'active', 0, ?)
  `
  ).run(id, input.title, input.description || null, input.reward, input.deadline || null, userId)
  db.prepare("UPDATE users SET total_goals = total_goals + 1 WHERE id = ?").run(userId)

  if (input.witnessUserId) {
    const witness = db
      .prepare("SELECT name FROM users WHERE id = ?")
      .get(input.witnessUserId) as { name: string } | undefined
    if (witness) {
      addWitness(id, input.witnessUserId, userId)
    }
  }

  const row = db.prepare("SELECT * FROM self_commitments WHERE id = ?").get(id) as any
  res.status(201).json(rowToGoal(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db
    .prepare(
      `
    SELECT * FROM self_commitments WHERE id = ? AND owner_user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!existing) {
    res.status(404).json({ error: "Goal not found" })
    return
  }

  const input = req.body as UpdateGoalInput
  const sets: string[] = []
  const params: any[] = []

  if (input.title !== undefined) {
    sets.push("title = ?")
    params.push(input.title)
  }
  if (input.description !== undefined) {
    sets.push("description = ?")
    params.push(input.description)
  }
  if (input.reward !== undefined) {
    sets.push("reward = ?")
    params.push(input.reward)
  }
  if (input.deadline !== undefined) {
    sets.push("deadline = ?")
    params.push(input.deadline)
  }
  if (input.status !== undefined) {
    sets.push("status = ?")
    params.push(input.status)
  }
  if (input.progress !== undefined) {
    sets.push("progress = ?")
    params.push(input.progress)
  }
  if (input.rewardClaimed !== undefined) {
    sets.push("reward_claimed = ?")
    params.push(input.rewardClaimed ? 1 : 0)
  }

  if (input.status === "achieved" && existing.status !== "achieved") {
    sets.push("achieved_at = datetime('now')")
  }

  if (input.progress !== undefined && input.progress === 100 && existing.progress !== 100) {
    sets.push("status = 'achieved'")
    sets.push("achieved_at = datetime('now')")
  }

  if (sets.length === 0) {
    res.json(rowToGoal(existing))
    return
  }

  params.push(param(req.params.id))
  db.prepare(`UPDATE self_commitments SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  const becameAchieved =
    (input.status === "achieved" && existing.status !== "achieved") ||
    (input.progress === 100 && existing.progress !== 100)

  if (becameAchieved) {
    db.prepare(
      `
      UPDATE users SET achieved_goals = achieved_goals + 1, trust_score = MIN(100, trust_score + 5)
      WHERE id = ?
    `
    ).run(existing.owner_user_id)
    notifyGoalAchieved(existing.owner_user_id, existing.title, existing.id)
    notifyWitnesses(existing.id, existing.title, "achieved")
  }

  if (input.status === "abandoned" && existing.status !== "abandoned") {
    db.prepare(
      `
      UPDATE users SET abandoned_goals = abandoned_goals + 1, trust_score = MAX(0, trust_score - 5)
      WHERE id = ?
    `
    ).run(existing.owner_user_id)
  }

  const updated = db
    .prepare("SELECT * FROM self_commitments WHERE id = ?")
    .get(param(req.params.id)) as any
  res.json(rowToGoal(updated))
})

router.post("/:id/claim-reward", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db
    .prepare(
      `
    SELECT * FROM self_commitments WHERE id = ? AND owner_user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any

  if (!existing) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  if (existing.status !== "achieved" && existing.status !== "reward_claimed") {
    res.status(400).json({ error: "Goal must be achieved before claiming reward" })
    return
  }
  if (existing.reward_claimed) {
    res.status(400).json({ error: "Reward already claimed" })
    return
  }

  db.prepare(
    `
    UPDATE self_commitments SET reward_claimed = 1, status = 'reward_claimed' WHERE id = ?
  `
  ).run(param(req.params.id))

  createNotification(
    req.user!.userId,
    "reward_ready",
    "奖励已兑现",
    `你已兑现「${existing.title}」的奖励：${existing.reward}`,
    existing.id
  )

  const updated = db
    .prepare("SELECT * FROM self_commitments WHERE id = ?")
    .get(param(req.params.id)) as any
  res.json(rowToGoal(updated))
})

router.get("/:id/witnesses", requireAuth, (req, res) => {
  const db = getDb()
  const goal = db
    .prepare(
      `
    SELECT c.id FROM self_commitments c
    WHERE c.id = ?
      AND (
        c.owner_user_id = ?
        OR EXISTS (
          SELECT 1 FROM supervise_witnesses w
          WHERE w.commitment_id = c.id AND w.witness_user_id = ?
        )
      )
  `
    )
    .get(param(req.params.id), req.user!.userId, req.user!.userId)
  if (!goal) {
    res.status(404).json({ error: "Goal not found" })
    return
  }

  const rows = db
    .prepare(
      `
    SELECT w.*, u.name AS witness_name
    FROM supervise_witnesses w
    JOIN users u ON u.id = w.witness_user_id
    WHERE w.commitment_id = ?
    ORDER BY w.invited_at DESC
  `
    )
    .all(param(req.params.id)) as any[]
  res.json(rows.map(rowToWitness))
})

router.post("/:id/witnesses", requireAuth, (req, res) => {
  const db = getDb()
  const goal = db
    .prepare(
      `
    SELECT * FROM self_commitments WHERE id = ? AND owner_user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!goal) {
    res.status(404).json({ error: "Goal not found" })
    return
  }

  const { witnessUserId } = req.body
  if (!witnessUserId) {
    res.status(400).json({ error: "witnessUserId is required (real user only)" })
    return
  }

  const user = db.prepare("SELECT name FROM users WHERE id = ?").get(witnessUserId) as
    | { name: string }
    | undefined
  if (!user) {
    res.status(404).json({ error: "Witness user not found" })
    return
  }
  if (witnessUserId === req.user!.userId) {
    res.status(400).json({ error: "cannot invite yourself as witness" })
    return
  }

  const witness = addWitness(param(req.params.id), witnessUserId, req.user!.userId)
  res.status(201).json(witness)
})

router.patch("/:id/witnesses/:witnessId", requireAuth, (req, res) => {
  const db = getDb()
  const witness = db
    .prepare(
      `
    SELECT w.* FROM supervise_witnesses w
    JOIN self_commitments c ON c.id = w.commitment_id
    WHERE w.id = ? AND w.commitment_id = ?
      AND (c.owner_user_id = ? OR w.witness_user_id = ?)
  `
    )
    .get(
      param(req.params.witnessId),
      param(req.params.id),
      req.user!.userId,
      req.user!.userId
    ) as any

  if (!witness) {
    res.status(404).json({ error: "Witness not found" })
    return
  }

  const { status } = req.body
  if (!["confirmed", "declined"].includes(status)) {
    res.status(400).json({ error: "status must be confirmed or declined" })
    return
  }

  db.prepare(
    `
    UPDATE supervise_witnesses SET status = ?, confirmed_at = datetime('now') WHERE id = ?
  `
  ).run(status, param(req.params.witnessId))

  if (status === "confirmed") {
    const goal = db
      .prepare("SELECT title, owner_user_id FROM self_commitments WHERE id = ?")
      .get(param(req.params.id)) as any
    const wUser = db
      .prepare("SELECT name FROM users WHERE id = ?")
      .get(witness.witness_user_id) as { name: string }
    createNotification(
      goal.owner_user_id,
      "witness_confirmed",
      "见证人已确认",
      `${wUser.name} 已确认见证你的承诺「${goal.title}」`,
      param(req.params.id)
    )
  }

  const updated = db
    .prepare(
      `
    SELECT w.*, u.name AS witness_name
    FROM supervise_witnesses w
    JOIN users u ON u.id = w.witness_user_id
    WHERE w.id = ?
  `
    )
    .get(param(req.params.witnessId)) as any
  res.json(rowToWitness(updated))
})

router.delete("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db
    .prepare(
      `
    SELECT * FROM self_commitments WHERE id = ? AND owner_user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!existing) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  db.prepare("DELETE FROM self_commitments WHERE id = ?").run(param(req.params.id))
  db.prepare("UPDATE users SET total_goals = MAX(0, total_goals - 1) WHERE id = ?").run(
    existing.owner_user_id
  )
  res.status(204).send()
})

function addWitness(commitmentId: string, witnessUserId: string, _ownerUserId: string): GoalWitness {
  const db = getDb()
  const id = uuid()
  db.prepare(
    `
    INSERT INTO supervise_witnesses (id, commitment_id, witness_user_id)
    VALUES (?, ?, ?)
  `
  ).run(id, commitmentId, witnessUserId)

  const goal = db
    .prepare("SELECT title FROM self_commitments WHERE id = ?")
    .get(commitmentId) as { title: string }
  createNotification(
    witnessUserId,
    "witness_invite",
    "见证邀请",
    `你被邀请见证「${goal.title}」`,
    commitmentId
  )

  const row = db
    .prepare(
      `
    SELECT w.*, u.name AS witness_name
    FROM supervise_witnesses w
    JOIN users u ON u.id = w.witness_user_id
    WHERE w.id = ?
  `
    )
    .get(id) as any
  return rowToWitness(row)
}

function notifyWitnesses(commitmentId: string, goalTitle: string, event: string): void {
  const db = getDb()
  const witnesses = db
    .prepare(
      `
    SELECT witness_user_id FROM supervise_witnesses
    WHERE commitment_id = ? AND status = 'confirmed'
  `
    )
    .all(commitmentId) as { witness_user_id: string }[]

  for (const w of witnesses) {
    if (event === "achieved") {
      db.prepare(
        `
        UPDATE users SET trust_score = MIN(100, trust_score + 3) WHERE id = ?
      `
      ).run(w.witness_user_id)
    }
    createNotification(
      w.witness_user_id,
      "goal_achieved",
      "见证承诺已达成",
      event === "achieved"
        ? `你见证的「${goalTitle}」已达成，信任分 +3`
        : `你见证的「${goalTitle}」已更新`,
      commitmentId
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
    userId: row.owner_user_id,
  }
}

function rowToWitness(row: any): GoalWitness {
  return {
    id: row.id,
    goalId: row.commitment_id,
    witnessUserId: row.witness_user_id,
    witnessName: row.witness_name,
    status: row.status,
    invitedAt: row.invited_at,
    confirmedAt: row.confirmed_at,
  }
}

export default router
