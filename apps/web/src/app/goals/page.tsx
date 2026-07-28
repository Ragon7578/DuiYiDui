"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/layout/auth-guard"
import {
  fetchGoals,
  fetchGoalWitnesses,
  updateGoal,
  claimReward,
  addGoalWitness,
  fetchUsers,
} from "@/lib/api-client"
import { track } from "@/lib/analytics"
import { formatDate } from "@/lib/utils"
import type { Goal, GoalWitness, AuthUser } from "@/lib/types"
import Link from "next/link"

export default function GoalsPage() {
  return (
    <AuthGuard>
      <GoalsContent />
    </AuthGuard>
  )
}

function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
      .then(setGoals)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted">加载中...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">我的</h1>
          <p className="mt-1 text-sm text-muted">对自己的承诺 · 做到了，兑一兑</p>
        </div>
        <Link href="/create?set=self" className="btn-primary px-4 py-2 text-sm">
          创建
        </Link>
      </div>
      {goals.some((g) => g.status === "achieved" && !g.rewardClaimed) && (
        <p className="rounded border border-ok/30 bg-ok-soft/50 px-4 py-2 text-sm text-ink">
          有奖励待兑现——打开对应承诺，标记「奖励已兑现」。
        </p>
      )}
      <div className="space-y-4">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onUpdate={(updated) =>
            setGoals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
          } />
        ))}
        {goals.length === 0 && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">还没有承诺</p>
            <p className="mt-2 text-sm text-muted">
              写下一件要对得起自己的事，并想好奖励。
            </p>
            <Link href="/create?set=self" className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
              写下第一条「我的」承诺
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: (g: Goal) => void }) {
  const [witnesses, setWitnesses] = useState<GoalWitness[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [witnessId, setWitnessId] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchGoalWitnesses(goal.id).then(setWitnesses).catch(() => {})
    fetchUsers()
      .then((list) => setUsers(list.filter((u) => u.id !== goal.userId)))
      .catch(() => {})
  }, [goal.id, goal.userId])

  async function handleProgress(delta: number) {
    const progress = Math.min(100, Math.max(0, goal.progress + delta))
    setBusy(true)
    try {
      const updated = await updateGoal(goal.id, { progress })
      if (updated.status === "achieved" && goal.status !== "achieved") {
        track("achieve_goal")
      }
      onUpdate(updated)
    } finally {
      setBusy(false)
    }
  }

  async function handleClaim() {
    setBusy(true)
    try {
      const updated = await claimReward(goal.id)
      track("claim_reward")
      onUpdate(updated)
    } finally {
      setBusy(false)
    }
  }

  async function handleAbandon() {
    if (!confirm("确定放弃这条承诺吗？这会影响你的信任分。")) return
    setBusy(true)
    try {
      const updated = await updateGoal(goal.id, { status: "abandoned" })
      onUpdate(updated)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddWitness() {
    if (!witnessId) return
    setBusy(true)
    try {
      const w = await addGoalWitness(goal.id, witnessId)
      track("invite_witness")
      setWitnesses((prev) => [...prev, w])
      setWitnessId("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-bold">{goal.title}</h3>
            <Badge status={goal.status} />
          </div>
          {goal.description && (
            <p className="mt-1 text-sm text-muted">{goal.description}</p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">进度</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden bg-paper-deep">
              <div
                className="progress-fill h-1.5 bg-ink"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>
          {goal.status === "active" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleProgress(10)}
                disabled={busy || goal.progress >= 100}
                className="rounded border border-line px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                +10%
              </button>
              <button
                onClick={() => handleAbandon()}
                disabled={busy}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                放弃
              </button>
            </div>
          )}
          {(goal.status === "achieved" || goal.status === "reward_claimed") && goal.reward && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-seal font-medium">
                {goal.reward}
                {goal.rewardClaimed ? " ✅ 已兑现" : " ⏳ 待兑现"}
              </span>
              {goal.status === "achieved" && !goal.rewardClaimed && (
                <button
                  onClick={handleClaim}
                  disabled={busy}
                  className="rounded bg-seal px-3 py-1 text-xs font-semibold text-white hover:bg-ink disabled:opacity-50"
                >
                  兑现奖励
                </button>
              )}
            </div>
          )}
          {goal.status === "active" && goal.reward && (
            <p className="mt-2 text-sm text-seal font-medium">奖励: {goal.reward}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {goal.deadline && <span>截止: {formatDate(goal.deadline)}</span>}
            <span>创建于 {formatDate(goal.createdAt)}</span>
            {goal.achievedAt && <span>达成于 {formatDate(goal.achievedAt)}</span>}
          </div>

          {goal.status === "active" && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm font-medium">见证人（建议 1 人）</p>
              <p className="mb-2 text-xs text-muted">对方确认后，你达成时对方也会获得成就点 +3</p>
              {witnesses.length > 0 && (
                <div className="mb-2 space-y-1">
                  {witnesses.map((w) => (
                    <div key={w.id} className="flex items-center gap-2 text-sm">
                      <span>{w.witnessName}</span>
                      <Badge status={w.status} />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select
                  value={witnessId}
                  onChange={(e) => setWitnessId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="">选择见证人</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddWitness}
                  disabled={busy || !witnessId}
                  className="rounded border border-line px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  邀请
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
