import type { Clause, Contract, Goal, GoalWitness, Party } from "../types.js"

export interface SelfCommitmentRow {
  id: string
  owner_user_id: string
  title: string
  description: string | null
  reward: string
  reward_claimed: number
  deadline: string | null
  status: Goal["status"]
  progress: number
  created_at: string
  achieved_at: string | null
}

export interface WitnessRow {
  id: string
  commitment_id: string
  witness_user_id: string
  witness_name: string
  status: GoalWitness["status"]
  invited_at: string
  confirmed_at: string | null
}

export interface AgreementRow {
  id: string
  created_by_user_id: string
  title: string
  description: string
  status: Contract["status"]
  reward: string | null
  created_at: string
  updated_at: string
  signed_at: string | null
}

export interface PartyRow {
  agreement_id: string
  user_id: string
  display_name: string
  role: Party["role"]
  signed_at: string | null
}

export interface ClauseRow {
  id: string
  agreement_id: string
  content: string
  status: Clause["status"]
  due_date: string | null
}

export function toGoal(row: SelfCommitmentRow): Goal {
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

export function toWitness(row: WitnessRow): GoalWitness {
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

export function toContract(
  row: AgreementRow,
  parties: PartyRow[],
  clauses: ClauseRow[]
): Contract {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    reward: row.reward,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    signedAt: row.signed_at,
    parties: parties.map(
      (p): Party => ({
        id: p.user_id,
        name: p.display_name,
        role: p.role,
        signedAt: p.signed_at,
      })
    ),
    clauses: clauses.map(
      (c): Clause => ({
        id: c.id,
        content: c.content,
        status: c.status,
        dueDate: c.due_date,
      })
    ),
  }
}
