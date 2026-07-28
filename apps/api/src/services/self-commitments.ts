import { getDb } from "../db/schema.js"
import { type SelfCommitmentRow, type WitnessRow, toGoal, toWitness } from "../db/mappers.js"
import type { Goal, GoalWitness } from "../types.js"
import { createNotification } from "./notifications.js"
import { v4 as uuid } from "uuid"

const WITNESS_WITH_NAME = `
  SELECT w.*, u.name AS witness_name
  FROM supervise_witnesses w
  JOIN users u ON u.id = w.witness_user_id
`

export function getCommitmentForOwner(id: string, ownerUserId: string): SelfCommitmentRow | null {
  const row = getDb()
    .prepare("SELECT * FROM self_commitments WHERE id = ? AND owner_user_id = ?")
    .get(id, ownerUserId)
  return (row as SelfCommitmentRow | undefined) ?? null
}

export function listCommitmentsForOwner(ownerUserId: string): Goal[] {
  const rows = getDb()
    .prepare("SELECT * FROM self_commitments WHERE owner_user_id = ? ORDER BY created_at DESC")
    .all(ownerUserId) as unknown as SelfCommitmentRow[]
  return rows.map(toGoal)
}

export function listWitnesses(commitmentId: string): GoalWitness[] {
  const rows = getDb()
    .prepare(`${WITNESS_WITH_NAME} WHERE w.commitment_id = ? ORDER BY w.invited_at DESC`)
    .all(commitmentId) as unknown as WitnessRow[]
  return rows.map(toWitness)
}

export function inviteWitness(commitmentId: string, witnessUserId: string): GoalWitness | { error: string } {
  const db = getDb()
  const dup = db
    .prepare(
      "SELECT id FROM supervise_witnesses WHERE commitment_id = ? AND witness_user_id = ?"
    )
    .get(commitmentId, witnessUserId)
  if (dup) {
    return { error: "witness already invited" }
  }

  const id = uuid()
  db.prepare(
    "INSERT INTO supervise_witnesses (id, commitment_id, witness_user_id) VALUES (?, ?, ?)"
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

  const row = db.prepare(`${WITNESS_WITH_NAME} WHERE w.id = ?`).get(id) as unknown as WitnessRow
  return toWitness(row)
}

export function notifyConfirmedWitnesses(commitmentId: string, title: string): void {
  const db = getDb()
  const witnesses = db
    .prepare(
      "SELECT witness_user_id FROM supervise_witnesses WHERE commitment_id = ? AND status = 'confirmed'"
    )
    .all(commitmentId) as { witness_user_id: string }[]

  const bumpTrust = db.prepare(
    "UPDATE users SET trust_score = MIN(100, trust_score + 3) WHERE id = ?"
  )

  for (const w of witnesses) {
    bumpTrust.run(w.witness_user_id)
    createNotification(
      w.witness_user_id,
      "goal_achieved",
      "见证承诺已达成",
      `你见证的「${title}」已达成，信任分 +3`,
      commitmentId
    )
  }
}
