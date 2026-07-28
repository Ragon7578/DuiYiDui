export type GoalStatus = "active" | "achieved" | "reward_claimed" | "abandoned"

export interface Goal {
  id: string
  title: string
  description?: string | null
  reward: string
  rewardClaimed: boolean
  deadline?: string | null
  status: GoalStatus
  progress: number
  createdAt: string
  achievedAt?: string | null
  userId?: string
}

export type ContractStatus = "draft" | "active" | "completed" | "breached" | "cancelled"

export interface Party {
  id: string
  name: string
  role: "promisor" | "promisee" | "both"
  signedAt?: string | null
}

export interface Clause {
  id: string
  content: string
  status: "pending" | "fulfilled" | "breached"
  dueDate?: string | null
}

export interface Contract {
  id: string
  title: string
  description: string
  parties: Party[]
  clauses: Clause[]
  status: ContractStatus
  reward?: string | null
  createdAt: string
  updatedAt: string
  signedAt?: string | null
}

export interface Pledge {
  id: string
  title: string
  description: string
  maker: string
  deadline?: string | null
  status: "active" | "fulfilled" | "broken"
  createdAt: string
}

export interface UserProfile {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  avatar?: string | null
  trustScore: number
  totalGoals: number
  achievedGoals: number
  abandonedGoals: number
  totalContracts: number
  fulfilledContracts: number
  breachedContracts: number
  bio: string
  superviseUnlocked: boolean
  superviseUnlockRequired: number
  superviseUnlockProgress: number
  superviseUnlockEligible: boolean
  superviseUnlockedAt?: string | null
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

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  relatedId: string | null
  createdAt: string
}

export interface GoalWitness {
  id: string
  goalId: string
  witnessUserId: string | null
  witnessName: string
  status: "pending" | "confirmed" | "declined"
  invitedAt: string
  confirmedAt: string | null
}

export interface AuthUser {
  id: string
  name: string
}

export type PageProps = {
  params: Promise<Record<string, string>>
  searchParams: Promise<Record<string, string>>
}
