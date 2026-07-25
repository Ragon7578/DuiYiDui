export type GoalStatus = "active" | "achieved" | "reward_claimed" | "abandoned"

export interface Goal {
  id: string
  title: string
  description: string | null
  reward: string
  rewardClaimed: boolean
  deadline: string | null
  status: GoalStatus
  progress: number
  createdAt: string
  achievedAt: string | null
  userId: string
}

export type ContractStatus = "draft" | "active" | "completed" | "breached" | "cancelled"

export interface Party {
  id: string
  name: string
  role: "promisor" | "promisee" | "both"
  signedAt: string | null
}

export interface Clause {
  id: string
  content: string
  status: "pending" | "fulfilled" | "breached"
  dueDate: string | null
}

export interface Contract {
  id: string
  title: string
  description: string
  parties: Party[]
  clauses: Clause[]
  status: ContractStatus
  reward: string | null
  createdAt: string
  updatedAt: string
  signedAt: string | null
}

export interface Pledge {
  id: string
  title: string
  description: string
  maker: string
  deadline: string | null
  status: "active" | "fulfilled" | "broken"
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string
  avatar: string | null
  trustScore: number
  totalGoals: number
  achievedGoals: number
  abandonedGoals: number
  totalContracts: number
  fulfilledContracts: number
  breachedContracts: number
  bio: string
}

export interface Stats {
  totalGoals: number
  achievedGoals: number
  abandonedGoals: number
  activeGoals: number
  totalContracts: number
  completedContracts: number
  breachedContracts: number
  activeContracts: number
  totalPledges: number
  fulfilledPledges: number
  trustScore: number
}

export interface CreateGoalInput {
  title: string
  description?: string
  reward: string
  deadline?: string
  userId?: string
}

export interface UpdateGoalInput {
  title?: string
  description?: string
  reward?: string
  deadline?: string
  status?: GoalStatus
  progress?: number
  rewardClaimed?: boolean
}

export interface CreateContractInput {
  title: string
  description?: string
  parties: Omit<Party, "signedAt">[]
  clauses: Omit<Clause, "id">[]
  reward?: string
}

export interface CreatePledgeInput {
  title: string
  description?: string
  maker?: string
  deadline?: string
}
