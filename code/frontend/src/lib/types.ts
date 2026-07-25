export type GoalStatus = "active" | "achieved" | "reward_claimed" | "abandoned"

export interface Goal {
  id: string
  title: string
  description?: string
  reward: string
  rewardClaimed: boolean
  deadline?: string
  status: GoalStatus
  progress: number
  createdAt: string
  achievedAt?: string
}

export type ContractStatus = "draft" | "active" | "completed" | "breached" | "cancelled"

export interface Party {
  id: string
  name: string
  role: "promisor" | "promisee" | "both"
  signedAt?: string
}

export interface Clause {
  id: string
  content: string
  status: "pending" | "fulfilled" | "breached"
  dueDate?: string
}

export interface Contract {
  id: string
  title: string
  description: string
  parties: Party[]
  clauses: Clause[]
  status: ContractStatus
  reward?: string
  createdAt: string
  updatedAt: string
  signedAt?: string
}

export interface Pledge {
  id: string
  title: string
  description: string
  maker: string
  deadline?: string
  status: "active" | "fulfilled" | "broken"
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string
  avatar?: string
  trustScore: number
  totalGoals: number
  achievedGoals: number
  abandonedGoals: number
  totalContracts: number
  fulfilledContracts: number
  breachedContracts: number
  bio: string
}

export type PageProps = {
  params: Promise<Record<string, string>>
  searchParams: Promise<Record<string, string>>
}
