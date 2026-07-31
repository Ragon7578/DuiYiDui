"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/layout/auth-guard"
import { fetchPledges, updatePledge } from "@/lib/api-client"
import { formatDate } from "@/lib/utils"
import type { Pledge } from "@/lib/types"

export default function PledgesPage() {
  return (
    <AuthGuard>
      <PledgesContent />
    </AuthGuard>
  )
}

function PledgesContent() {
  const [pledges, setPledges] = useState<Pledge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPledges()
      .then(setPledges)
      .finally(() => setLoading(false))
  }, [])

  async function handleStatus(id: string, status: string) {
    const updated = await updatePledge(id, { status })
    setPledges((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  if (loading) return <p className="text-muted">加载中...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black tracking-tight">轻量承诺</h1>
        <p className="mt-1 text-sm text-muted">非正式记录 · 主路径请用带奖励的「我的」承诺</p>
      </div>
      <div className="space-y-3">
        {pledges.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                  <span>承诺人 · {p.maker}</span>
                  {p.deadline && <span>截止 {formatDate(p.deadline)}</span>}
                  <span>创建于 {formatDate(p.createdAt)}</span>
                </div>
                {p.status === "active" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleStatus(p.id, "fulfilled")}
                      className="rounded border border-ok/40 px-2 py-0.5 text-xs text-ok hover:bg-ok-soft"
                    >
                      已履行
                    </button>
                    <button
                      onClick={() => handleStatus(p.id, "broken")}
                      className="rounded border border-line px-2 py-0.5 text-xs text-muted hover:border-ink"
                    >
                      未履行
                    </button>
                  </div>
                )}
              </div>
              <Badge status={p.status} />
            </div>
          </Card>
        ))}
        {pledges.length === 0 && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">这里很安静</p>
            <p className="mt-2 text-sm text-muted">
              轻量承诺不进主导航。想认真兑奖，去创建一个带奖励的「我的」承诺。
            </p>
            <Link href="/create?set=self" className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
              创建带奖励的承诺
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
