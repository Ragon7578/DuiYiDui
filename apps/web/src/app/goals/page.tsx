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
} from "@/lib/api-client"
import { track } from "@/lib/analytics"
import { ApiError } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { useOtherUsers } from "@/lib/use-other-users"
import { UserSelect } from "@/components/users/user-select"
import Link from "next/link"
import type { Goal, GoalWitness } from "@/lib/types"
import { ROLES } from "@/lib/roles"

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
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
      .then(setGoals)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted">加载中...</p>

  const pendingClaim = goals.filter((g) => g.status === "achieved" && !g.rewardClaimed)

  async function handleClaim(id: string) {
    setClaimingId(id)
    try {
      const updated = await claimReward(id)
      track("claim_reward")
      setGoals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">{ROLES.self.navLabel}</h1>
          <p className="mt-1 text-sm text-muted">{ROLES.self.projectLabel} · 做到了，兑一兑</p>
        </div>
        <Link href={ROLES.self.createHref} className="btn-primary px-4 py-2 text-sm">
          创建
        </Link>
      </div>
      {pendingClaim.length > 0 && (
        <section className="space-y-3 rounded border border-ok/30 bg-ok-soft/40 p-5">
          <h2 className="font-display text-lg font-bold text-ink">奖励还在等你兑现</h2>
          <p className="text-sm text-muted">做到了就去拿奖励，勾掉才算真正闭环。</p>
          <div className="space-y-2">
            {pendingClaim.map((g) => (
              <div
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-ok/20 bg-white/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{g.title}</p>
                  <p className="text-sm text-seal">奖励 · {g.reward}</p>
                </div>
                <button
                  type="button"
                  disabled={claimingId === g.id}
                  onClick={() => handleClaim(g.id)}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {claimingId === g.id ? "标记中..." : "标记奖励已兑现"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onUpdate={(updated) =>
              setGoals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            }
          />
        ))}
        {goals.length === 0 && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">还没有承诺</p>
            <p className="mt-2 text-sm text-muted">
              写下一件要对得起自己的事，并想好奖励。
            </p>
            <Link href={ROLES.self.createHref} className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
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
  const [witnessId, setWitnessId] = useState("")
  const [inviteError, setInviteError] = useState("")
  const [busy, setBusy] = useState(false)
  const users = useOtherUsers([
    ...(goal.userId ? [goal.userId] : []),
    ...witnesses.map((w) => w.witnessUserId).filter(Boolean) as string[],
  ])

  useEffect(() => {
    fetchGoalWitnesses(goal.id).then(setWitnesses).catch(() => {})
  }, [goal.id])

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

  async function handleAchieve() {
    setBusy(true)
    try {
      const updated = await updateGoal(goal.id, { status: "achieved", progress: 100 })
      if (goal.status !== "achieved") track("achieve_goal")
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
    if (!confirm("确定结束这个承诺吗？会记入履约档案。下次可以换一种承诺再来。")) return
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
    setInviteError("")
    try {
      const w = await addGoalWitness(goal.id, witnessId)
      track("invite_witness")
      setWitnesses((prev) => [...prev, w])
      setWitnessId("")
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "邀请失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-bold">{goal.title}</h3>
            <Badge status={goal.status} />
          </div>
          {goal.description && (
            <p className="mt-1 text-sm text-muted">{goal.description}</p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">进度</span>
              <span className="font-medium tabular-nums">{goal.progress}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden bg-paper-deep">
              <div
                className="progress-fill h-1.5 bg-ink"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>
          {goal.status === "active" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleProgress(10)}
                disabled={busy || goal.progress >= 100}
                className="rounded border border-line px-3 py-1 text-xs font-semibold hover:border-ink disabled:opacity-50"
              >
                更新进度
              </button>
              <button
                onClick={handleAchieve}
                disabled={busy}
                className="rounded border border-ok/40 bg-ok-soft/40 px-3 py-1 text-xs font-semibold text-ok hover:border-ok disabled:opacity-50"
              >
                标记已达成
              </button>
              <button
                onClick={() => handleAbandon()}
                disabled={busy}
                className="rounded border border-line px-3 py-1 text-xs text-muted hover:border-ink disabled:opacity-50"
              >
                结束承诺
              </button>
            </div>
          )}
          {(goal.status === "achieved" || goal.status === "reward_claimed") && goal.reward && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-seal">
                奖励 · {goal.reward}
                {goal.rewardClaimed ? " · 已兑现" : " · 待兑现"}
              </span>
              {goal.status === "achieved" && !goal.rewardClaimed && (
                <button
                  onClick={handleClaim}
                  disabled={busy}
                  className="btn-primary px-3 py-1 text-xs"
                >
                  标记奖励已兑现
                </button>
              )}
            </div>
          )}
          {goal.status === "active" && goal.reward && (
            <p className="mt-2 text-sm font-medium text-seal">奖励 · {goal.reward}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {goal.deadline && <span>截止 {formatDate(goal.deadline)}</span>}
            <span>创建于 {formatDate(goal.createdAt)}</span>
            {goal.achievedAt && <span>达成于 {formatDate(goal.achievedAt)}</span>}
          </div>

          {goal.status === "active" && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <p className="text-sm font-semibold">见证人（建议 1 人）</p>
              <p className="text-xs text-muted">找一个在乎你说到做到的人；对方确认后，你达成时对方也会涨成就点</p>
              {witnesses.length > 0 && (
                <div className="space-y-1">
                  {witnesses.map((w) => (
                    <div key={w.id} className="flex items-center gap-2 text-sm">
                      <span>{w.witnessName}</span>
                      <Badge status={w.status} />
                    </div>
                  ))}
                </div>
              )}
              {witnesses.length === 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <UserSelect
                      value={witnessId}
                      onChange={setWitnessId}
                      users={users}
                      placeholder="选择已注册用户"
                      className="input-field flex-1 text-sm"
                    />
                    <button
                      onClick={handleAddWitness}
                      disabled={busy || !witnessId}
                      className="rounded border border-line px-3 py-2 text-sm font-semibold hover:border-ink disabled:opacity-50"
                    >
                      邀请
                    </button>
                  </div>
                  <p className="text-xs text-muted">见证人须为已注册用户；对方确认后，你达成时对方也会涨成就点。</p>
                  {inviteError && (
                    <p className="text-xs text-seal">{inviteError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
