"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Badge } from "@/components/ui/badge"
import { FormLabel } from "@/components/ui/form-label"
import { AuthGuard } from "@/components/layout/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { fetchGoals, updateProfile } from "@/lib/api-client"
import { ApiError } from "@/lib/api"
import type { Goal } from "@/lib/types"

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}

function ProfileContent() {
  const { user, refresh } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    refresh()
    fetchGoals().then(setGoals).catch(() => {})
  }, [refresh])

  useEffect(() => {
    if (!user) return
    setEmail(user.email || "")
    setPhone(user.phone || "")
    setBio(user.bio || "")
  }, [user])

  if (!user) return null

  const achievedRate = user.totalGoals > 0
    ? Math.round((user.achievedGoals / user.totalGoals) * 100)
    : 0
  const abandonRate = user.totalGoals > 0
    ? Math.round((user.abandonedGoals / user.totalGoals) * 100)
    : 0

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setSaving(true)
    try {
      await updateProfile({
        email: email.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim(),
      })
      await refresh()
      setMessage("资料已保存。绑定邮箱后，可通过邮箱重置密码。")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <section className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded bg-ink font-display text-3xl font-black text-white">
          {user.name[0]}
        </div>
        <h1 className="mt-4 font-display text-3xl font-black">{user.name}</h1>
        <p className="mt-1 text-sm text-muted">用户名（用于登录，注册后不可在此修改）</p>
      </section>

      <Card>
        <h2 className="mb-1 font-display text-xl font-bold">个人资料</h2>
        <p className="mb-4 text-xs text-muted">
          注册时只需用户名和密码。邮箱、手机可在登录后补充，用于找回密码等。
        </p>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {error && (
            <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
          )}
          {message && (
            <p className="rounded border border-ok/20 bg-ok-soft px-3 py-2 text-sm text-ok">{message}</p>
          )}
          <div>
            <FormLabel>邮箱</FormLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="绑定后可用于重置密码"
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>手机号</FormLabel>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="选填"
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>简介</FormLabel>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="介绍一下自己"
              className="input-field"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm">
            {saving ? "保存中..." : "保存资料"}
          </button>
        </form>
      </Card>

      <section className="grid grid-cols-2 gap-4">
        <StatsCard label="信任分" value={user.trustScore} description="满分 100" accent />
        <StatsCard label="总目标" value={user.totalGoals} />
        <StatsCard label="已达成" value={user.achievedGoals} />
        <StatsCard label="已放弃" value={user.abandonedGoals} />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <StatsCard label="总契约" value={user.totalContracts} />
        <StatsCard label="已履行" value={user.fulfilledContracts} />
      </section>

      <Card>
        <h2 className="mb-4 font-semibold">信任评价</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span>目标达成率</span>
              <span className="font-medium">{achievedRate}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden bg-paper-deep">
              <div className="h-1.5 bg-ok" style={{ width: `${achievedRate}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>目标放弃率</span>
              <span className="font-medium">{abandonRate}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden bg-paper-deep">
              <div className="h-1.5 bg-seal" style={{ width: `${abandonRate}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">目标记录</h2>
        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
              <div>
                <p className="font-medium">{g.title}</p>
                {g.reward && (
                  <p className="text-xs text-seal">奖励 · {g.reward}{g.rewardClaimed ? " · 已兑现" : ""}</p>
                )}
              </div>
              <Badge status={g.status} />
            </div>
          ))}
          {goals.length === 0 && (
            <p className="text-sm text-muted">暂无目标记录</p>
          )}
        </div>
      </Card>
    </div>
  )
}
