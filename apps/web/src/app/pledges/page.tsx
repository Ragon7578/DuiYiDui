"use client"

import { useEffect, useState } from "react"
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

  if (loading) return <p className="text-gray-400">加载中...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的承诺</h1>
      <div className="space-y-3">
        {pledges.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>承诺人: {p.maker}</span>
                  {p.deadline && <span>截止: {formatDate(p.deadline)}</span>}
                  <span>创建于 {formatDate(p.createdAt)}</span>
                </div>
                {p.status === "active" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleStatus(p.id, "fulfilled")}
                      className="rounded border px-2 py-0.5 text-xs text-green-600 hover:bg-green-50"
                    >
                      已履行
                    </button>
                    <button
                      onClick={() => handleStatus(p.id, "broken")}
                      className="rounded border px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
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
          <p className="text-sm text-gray-400">还没有承诺记录。</p>
        )}
      </div>
    </div>
  )
}
