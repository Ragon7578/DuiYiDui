import { apiFetch, setToken, clearToken } from "./api"
import type {
  Goal,
  Contract,
  Pledge,
  UserProfile,
  Notification,
  GoalWitness,
  Stats,
  AuthUser,
} from "./types"

export interface LoginResponse {
  token: string
  user: UserProfile
}

export function login(username: string, password: string) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export function register(username: string, password: string, confirmPassword?: string) {
  return apiFetch<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      confirmPassword: confirmPassword ?? password,
    }),
  })
}

export function fetchMe() {
  return apiFetch<UserProfile>("/api/auth/me")
}

export function fetchUsers() {
  return apiFetch<AuthUser[]>("/api/auth/users")
}

export function fetchStats() {
  return apiFetch<Stats>("/api/profile/stats")
}

export function fetchProfile() {
  return apiFetch<UserProfile>("/api/profile")
}

export function updateProfile(data: {
  email?: string | null
  phone?: string | null
  bio?: string
  avatar?: string | null
}) {
  return apiFetch<UserProfile>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function unlockSuperviseRole() {
  return apiFetch<{ message: string; user: UserProfile }>("/api/profile/unlock-supervise", {
    method: "POST",
  })
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string; resetUrl?: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(token: string, password: string, confirmPassword: string) {
  return apiFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password, confirmPassword }),
  })
}

export function fetchGoals() {
  return apiFetch<Goal[]>("/api/goals")
}

export function fetchGoal(id: string) {
  return apiFetch<Goal>(`/api/goals/${id}`)
}

export function createGoal(data: {
  title: string
  reward: string
  description?: string
  deadline?: string
  witnessUserId?: string
}) {
  return apiFetch<Goal>("/api/goals", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateGoal(
  id: string,
  data: Partial<{
    title: string
    description: string
    reward: string
    deadline: string
    status: string
    progress: number
    rewardClaimed: boolean
  }>
) {
  return apiFetch<Goal>(`/api/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function claimReward(id: string) {
  return apiFetch<Goal>(`/api/goals/${id}/claim-reward`, { method: "POST" })
}

export function fetchGoalWitnesses(goalId: string) {
  return apiFetch<GoalWitness[]>(`/api/goals/${goalId}/witnesses`)
}

export function addGoalWitness(goalId: string, witnessUserId: string) {
  return apiFetch<GoalWitness>(`/api/goals/${goalId}/witnesses`, {
    method: "POST",
    body: JSON.stringify({ witnessUserId }),
  })
}

export function updateWitness(goalId: string, witnessId: string, status: "confirmed" | "declined") {
  return apiFetch<GoalWitness>(`/api/goals/${goalId}/witnesses/${witnessId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function fetchContracts() {
  return apiFetch<Contract[]>("/api/contracts")
}

export function fetchContract(id: string) {
  return apiFetch<Contract>(`/api/contracts/${id}`)
}

export function createContract(data: {
  title: string
  description?: string
  reward?: string
  parties: { id?: string; name: string; role: string }[]
  clauses: { content: string; dueDate?: string }[]
}) {
  return apiFetch<Contract>("/api/contracts", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updateClause(contractId: string, clauseId: string, status: string) {
  return apiFetch<Contract>(`/api/contracts/${contractId}/clauses/${clauseId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function fetchPledges() {
  return apiFetch<Pledge[]>("/api/pledges")
}

export function createPledge(data: { title: string; description?: string; deadline?: string }) {
  return apiFetch<Pledge>("/api/pledges", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function updatePledge(id: string, data: { status?: string }) {
  return apiFetch<Pledge>(`/api/pledges/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function fetchNotifications() {
  return apiFetch<Notification[]>("/api/notifications")
}

export function fetchUnreadCount() {
  return apiFetch<{ count: number }>("/api/notifications/unread-count")
}

export function markNotificationRead(id: string) {
  return apiFetch<Notification>(`/api/notifications/${id}/read`, { method: "PATCH" })
}

export function markAllNotificationsRead() {
  return apiFetch<{ success: boolean }>("/api/notifications/read-all", { method: "PATCH" })
}

export interface ParsedGoal {
  title: string
  description?: string
  reward: string
  deadline?: string
}

export interface ParsedContract {
  title: string
  description?: string
  reward?: string
  parties: string[]
  clauses: string[]
}

export interface ParseResult {
  mode: "goal" | "contract"
  goals: ParsedGoal[]
  contracts: ParsedContract[]
  confidence: number
  summary: string
}

export function parseIntent(text: string, mode?: "goal" | "contract") {
  return apiFetch<ParseResult>("/api/ai/parse", {
    method: "POST",
    body: JSON.stringify({ text, mode }),
  })
}

export { setToken, clearToken }
