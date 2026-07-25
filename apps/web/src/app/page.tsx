"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { StatsCard } from "@/components/ui/stats-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/layout/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { fetchGoals, fetchContracts } from "@/lib/api-client"
import { formatDate } from "@/lib/utils"
import type { Goal, Contract } from "@/lib/types"

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  )
}

function HomeContent() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

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
    return (
      <p className="animate-pulse-soft text-muted">加载中...</p>
    )
  }

  const activeGoals = goals.filter((g) => g.status === "active")
  const activeContracts = contracts.filter((c) => c.status === "active")

  return (
    <div className="space-y-10">
      <section className="animate-rise relative overflow-hidden panel border-ink/10 p-8 md:p-10">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-seal/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-info/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-seal">
          Contract Spirit
        </p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-ink md:text-5xl">
          你好，
          <span className="ink-underline">{user.name}</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted md:text-lg">
          {user.bio || "对自己守信，才能对他人守信。记录承诺，兑现奖励。"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/create" className="btn-primary px-5 py-2.5 text-sm">
            立下一份契约
          </Link>
          <Link
            href="/goals"
            className="rounded border border-line bg-white/60 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink"
          >
            查看目标
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 animate-rise-delay-1 lg:grid-cols-4 lg:gap-4">
        <StatsCard label="信任分" value={user.trustScore} description="满分 100" accent />
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
                  {g.description && (
                    <p className="mt-2 text-sm text-muted">{g.description}</p>
                  )}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">进度</span>
                      <span className="font-semibold tabular-nums">{g.progress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden bg-paper-deep">
                      <div
                        className="progress-fill h-1.5 bg-ink"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-seal">
                    奖励 · {g.reward}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          {activeGoals.length === 0 && (
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
                    <p className="mt-2 text-sm text-muted line-clamp-2">{c.description}</p>
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
    </div>
  )
}
