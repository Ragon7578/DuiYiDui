"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { StatsCard } from "@/components/ui/stats-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { fetchGoals, fetchContracts, claimReward } from "@/lib/api-client"
import { track } from "@/lib/analytics"
import { formatDate } from "@/lib/utils"
import type { Goal, Contract } from "@/lib/types"

/** 首页 = 欢迎页；登录后在下方展示进行中事项 */
export default function Home() {
  const { user, loading } = useAuth()

  useEffect(() => {
    track("page_home")
  }, [])

  if (loading) {
    return <p className="animate-pulse-soft text-muted">加载中...</p>
  }

  return (
    <div className="space-y-10">
      <WelcomeHero loggedIn={Boolean(user)} userName={user?.name} trustScore={user?.trustScore} />
      {user ? <HomeDashboard /> : <WelcomeGuestExtra />}
    </div>
  )
}

function WelcomeHero({
  loggedIn,
  userName,
  trustScore,
}: {
  loggedIn: boolean
  userName?: string
  trustScore?: number
}) {
  return (
    <section className="animate-rise relative overflow-hidden panel border-ink/10 p-8 md:p-12">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-seal/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-info/10 blur-3xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-seal">DuiYiDui</p>
      <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-ink md:text-5xl">
        兑一兑
      </h1>
      <p className="mt-2 font-display text-xl font-bold text-ink/80 md:text-2xl">
        做到了，兑一兑。
      </p>
      <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
        {loggedIn
          ? `你好，${userName}。写下一件要对得起自己的事，想好奖励，做到了就去兑现。`
          : "把目标与奖励写清楚。自己达成，或监督他人达成，都能涨成就点。"}
      </p>
      {loggedIn && trustScore != null && (
        <p className="mt-2 text-sm text-muted">履约档案 · 信任分 {trustScore}</p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {loggedIn ? (
          <>
            <Link href="/create" className="btn-primary px-5 py-2.5 text-sm">
              创建目标
            </Link>
            <Link
              href="/goals"
              className="rounded border border-line bg-white/60 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink"
            >
              查看目标
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="btn-primary px-5 py-2.5 text-sm">
              开始使用
            </Link>
            <Link
              href="/login"
              className="rounded border border-line bg-white/60 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink"
            >
              已有账号登录
            </Link>
          </>
        )}
      </div>
    </section>
  )
}

function WelcomeGuestExtra() {
  return (
    <section className="animate-rise-delay-1 grid gap-6 md:grid-cols-3">
      {[
        { t: "写清奖励", d: "做到了给自己什么？先想清楚，才兑得了。" },
        { t: "可以有人看着", d: "邀请见证人；对方确认后，你达成他也涨成就点。" },
        { t: "信用看得见", d: "自己做到、监督他人做到，都记进信任分。" },
      ].map((item) => (
        <div key={item.t} className="border-t border-line pt-4">
          <h2 className="font-display text-lg font-bold">{item.t}</h2>
          <p className="mt-2 text-sm text-muted">{item.d}</p>
        </div>
      ))}
    </section>
  )
}

function HomeDashboard() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchGoals(), fetchContracts()])
      .then(([g, c]) => {
        setGoals(g)
        setContracts(c)
      })
      .catch(() => {
        setGoals([])
        setContracts([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !user) {
    return <p className="animate-pulse-soft text-muted">加载中...</p>
  }

  const activeGoals = goals.filter((g) => g.status === "active")
  const pendingClaim = goals.filter((g) => g.status === "achieved" && !g.rewardClaimed)
  const activeContracts = contracts.filter((c) => c.status === "active")
  const hasNothing = goals.length === 0

  async function handleClaim(id: string) {
    setClaimingId(id)
    try {
      const updated = await claimReward(id)
      track("claim_reward")
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <>
      {pendingClaim.length > 0 && (
        <section className="animate-rise space-y-3 rounded border border-ok/30 bg-ok-soft/40 p-5">
          <h2 className="font-display text-xl font-bold text-ink">奖励还在等你兑现</h2>
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

      {hasNothing && (
        <section className="animate-rise rounded border border-dashed border-line bg-white/50 px-6 py-10 text-center">
          <p className="font-display text-xl font-bold">还没有承诺</p>
          <p className="mt-2 text-sm text-muted">
            例如：连续跑步 30 天 → 奖励一双跑鞋。写清楚，才兑得了。
          </p>
          <Link href="/create" className="btn-primary mt-5 inline-block px-5 py-2.5 text-sm">
            创建带奖励的目标
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 animate-rise-delay-1 lg:grid-cols-4 lg:gap-4">
        <StatsCard label="信任分" value={user.trustScore} description="履约档案" accent />
        <StatsCard label="目标" value={`${user.achievedGoals}/${user.totalGoals}`} description="已达成 / 总数" />
        <StatsCard label="契约" value={`${user.fulfilledContracts}/${user.totalContracts}`} description="已履行 / 总数" />
        <StatsCard label="进行中" value={activeGoals.length + activeContracts.length} description="目标 + 契约" />
      </section>

      <section className="animate-rise-delay-2 space-y-4">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">进行中的目标</h2>
          <Link href="/goals" className="text-sm font-semibold text-seal hover:underline">
            查看全部
          </Link>
        </div>
        <div className="space-y-3">
          {activeGoals.map((g) => (
            <Card key={g.id} className="panel-interactive">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold">{g.title}</h3>
                    <Badge status={g.status} />
                  </div>
                  {g.description && <p className="mt-2 text-sm text-muted">{g.description}</p>}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">进度</span>
                      <span className="font-semibold tabular-nums">{g.progress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden bg-paper-deep">
                      <div className="progress-fill h-1.5 bg-ink" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-seal">奖励 · {g.reward}</p>
                </div>
              </div>
            </Card>
          ))}
          {!hasNothing && activeGoals.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              暂无进行中的目标，
              <Link href="/create" className="font-semibold text-seal hover:underline">
                创建一个
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="animate-rise-delay-3 space-y-4">
        <div className="flex items-end justify-between border-b border-line pb-3">
          <h2 className="font-display text-2xl font-bold tracking-tight">进行中的契约</h2>
          <Link href="/contracts" className="text-sm font-semibold text-seal hover:underline">
            查看全部
          </Link>
        </div>
        <div className="space-y-3">
          {activeContracts.map((c) => (
            <Link key={c.id} href={`/contracts/${c.id}`} className="block">
              <Card className="panel-interactive">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold">{c.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{c.description}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium uppercase tracking-wider text-muted">
                  <span>{formatDate(c.createdAt)}</span>
                  <span>{c.parties.length} 方</span>
                  <span>{c.clauses.length} 条款</span>
                </div>
              </Card>
            </Link>
          ))}
          {activeContracts.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">暂无进行中的契约</p>
          )}
        </div>
      </section>
    </>
  )
}
