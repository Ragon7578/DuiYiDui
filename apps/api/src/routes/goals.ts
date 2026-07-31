import { Router } from "express"
import { getDb } from "../db/schema.js"
import { toGoal } from "../db/mappers.js"
import { adjustTrustScore } from "../db/trust.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import { createNotification, notifyGoalAchieved } from "../services/notifications.js"
import {
  getCommitmentForOwner,
  inviteWitness,
  listCommitmentsForOwner,
  listWitnesses,
  notifyConfirmedWitnesses,
} from "../services/self-commitments.js"
import { getUserById } from "../services/users.js"
import type { CreateGoalInput, UpdateGoalInput } from "../types.js"

const router = Router()

router.get("/", requireAuth, (req, res) => {
  res.json(listCommitmentsForOwner(req.user!.userId))
})

router.get("/:id", requireAuth, (req, res) => {
  const row = getCommitmentForOwner(param(req.params.id), req.user!.userId)
  if (!row) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  res.json(toGoal(row))
})

router.post("/", requireAuth, (req, res) => {
  const input = req.body as CreateGoalInput
  if (!input.title || !input.reward) {
    res.status(400).json({ error: "title and reward are required" })
    return
  }

  const db = getDb()
  const id = uuid()
  const userId = req.user!.userId

  db.prepare(
    `INSERT INTO self_commitments (id, title, description, reward, deadline, status, progress, owner_user_id)
     VALUES (?, ?, ?, ?, ?, 'active', 0, ?)`
  ).run(id, input.title, input.description || null, input.reward, input.deadline || null, userId)
  db.prepare(
    "UPDATE users SET total_goals = total_goals + 1, updated_at = datetime('now') WHERE id = ?"
  ).run(userId)

  if (input.witnessUserId) {
    const witness = getUserById(input.witnessUserId)
    if (witness) {
      const result = inviteWitness(id, witness.userId)
      if ("error" in result) {
        // 创建时邀请失败不阻断承诺创建
      }
    }
  }

  const row = getCommitmentForOwner(id, userId)!
  res.status(201).json(toGoal(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const existing = getCommitmentForOwner(param(req.params.id), req.user!.userId)
  if (!existing) {
    res.status(404).json({ error: "Goal not found" })
    return
  }

  const input = req.body as UpdateGoalInput
  const sets: string[] = ["updated_at = datetime('now')"]
  const params: (string | number | null)[] = []

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
    if (input.rewardClaimed) {
      sets.push("reward_claimed_at = datetime('now')")
    }
  }

  if (input.status === "achieved" && existing.status !== "achieved") {
    sets.push("achieved_at = datetime('now')")
  }
  if (input.progress === 100 && existing.progress !== 100) {
    sets.push("status = 'achieved'")
    sets.push("achieved_at = datetime('now')")
  }
  if (input.status === "abandoned" && existing.status !== "abandoned") {
    sets.push("abandoned_at = datetime('now')")
  }

  params.push(param(req.params.id))
  getDb().prepare(`UPDATE self_commitments SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  const becameAchieved =
    (input.status === "achieved" && existing.status !== "achieved") ||
    (input.progress === 100 && existing.progress !== 100)

  if (becameAchieved) {
    getDb()
      .prepare(
        "UPDATE users SET achieved_goals = achieved_goals + 1, updated_at = datetime('now') WHERE id = ?"
      )
      .run(existing.owner_user_id)
    adjustTrustScore(existing.owner_user_id, 5, "goal_achieved", {
      type: "goal",
      id: existing.id,
    })
    notifyGoalAchieved(existing.owner_user_id, existing.title, existing.id)
    notifyConfirmedWitnesses(existing.id, existing.title)
  }

  if (input.status === "abandoned" && existing.status !== "abandoned") {
    getDb()
      .prepare(
        "UPDATE users SET abandoned_goals = abandoned_goals + 1, updated_at = datetime('now') WHERE id = ?"
      )
      .run(existing.owner_user_id)
    adjustTrustScore(existing.owner_user_id, -5, "goal_abandoned", {
      type: "goal",
      id: existing.id,
    })
  }

  const updated = getCommitmentForOwner(param(req.params.id), req.user!.userId)!
  res.json(toGoal(updated))
})

router.post("/:id/claim-reward", requireAuth, (req, res) => {
  const existing = getCommitmentForOwner(param(req.params.id), req.user!.userId)
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

  getDb().prepare(
    `UPDATE self_commitments
     SET reward_claimed = 1, status = 'reward_claimed',
         reward_claimed_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`
  ).run(param(req.params.id))

  createNotification(
    req.user!.userId,
    "reward_ready",
    "奖励已兑现",
    `你已兑现「${existing.title}」的奖励：${existing.reward}`,
    existing.id
  )

  const updated = getCommitmentForOwner(param(req.params.id), req.user!.userId)!
  res.json(toGoal(updated))
})

router.get("/:id/witnesses", requireAuth, (req, res) => {
  const db = getDb()
  const access = db
    .prepare(
      `SELECT c.id FROM self_commitments c
       WHERE c.id = ?
         AND (c.owner_user_id = ?
              OR EXISTS (
                SELECT 1 FROM supervise_witnesses w
                WHERE w.commitment_id = c.id AND w.witness_user_id = ?
              ))`
    )
    .get(param(req.params.id), req.user!.userId, req.user!.userId)
  if (!access) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  res.json(listWitnesses(param(req.params.id)))
})

router.post("/:id/witnesses", requireAuth, (req, res) => {
  const goal = getCommitmentForOwner(param(req.params.id), req.user!.userId)
  if (!goal) {
    res.status(404).json({ error: "Goal not found" })
    return
  }

  const { witnessUserId } = req.body
  if (!witnessUserId) {
    res.status(400).json({ error: "witnessUserId is required (real user only)" })
    return
  }
  if (witnessUserId === req.user!.userId) {
    res.status(400).json({ error: "cannot invite yourself as witness" })
    return
  }
  if (!getUserById(witnessUserId)) {
    res.status(404).json({ error: "Witness user not found" })
    return
  }

  const result = inviteWitness(param(req.params.id), witnessUserId)
  if ("error" in result) {
    res.status(409).json({ error: result.error })
    return
  }
  res.status(201).json(result)
})

router.patch("/:id/witnesses/:witnessId", requireAuth, (req, res) => {
  const db = getDb()
  const witness = db
    .prepare(
      `SELECT w.* FROM supervise_witnesses w
       JOIN self_commitments c ON c.id = w.commitment_id
       WHERE w.id = ? AND w.commitment_id = ?
         AND (c.owner_user_id = ? OR w.witness_user_id = ?)`
    )
    .get(
      param(req.params.witnessId),
      param(req.params.id),
      req.user!.userId,
      req.user!.userId
    ) as { witness_user_id: string } | undefined

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
    `UPDATE supervise_witnesses SET status = ?, confirmed_at = datetime('now') WHERE id = ?`
  ).run(status, param(req.params.witnessId))

  if (status === "confirmed") {
    const goal = db
      .prepare("SELECT title, owner_user_id FROM self_commitments WHERE id = ?")
      .get(param(req.params.id)) as { title: string; owner_user_id: string }
    const wUser = getUserById(witness.witness_user_id)
    createNotification(
      goal.owner_user_id,
      "witness_confirmed",
      "见证人已确认",
      `${wUser?.name ?? "见证人"} 已确认见证你的承诺「${goal.title}」`,
      param(req.params.id)
    )
  }

  const rows = listWitnesses(param(req.params.id))
  const updated = rows.find((w) => w.id === param(req.params.witnessId))
  res.json(updated)
})

router.delete("/:id", requireAuth, (req, res) => {
  const existing = getCommitmentForOwner(param(req.params.id), req.user!.userId)
  if (!existing) {
    res.status(404).json({ error: "Goal not found" })
    return
  }
  getDb().prepare("DELETE FROM self_commitments WHERE id = ?").run(param(req.params.id))
  getDb()
    .prepare(
      "UPDATE users SET total_goals = MAX(0, total_goals - 1), updated_at = datetime('now') WHERE id = ?"
    )
    .run(existing.owner_user_id)
  res.status(204).send()
})

export default router
