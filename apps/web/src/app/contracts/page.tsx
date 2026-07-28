"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ContractCard } from "@/components/contract/contract-card"
import { AuthGuard } from "@/components/layout/auth-guard"
import { fetchContracts } from "@/lib/api-client"
import type { Contract } from "@/lib/types"

export default function ContractsPage() {
  return (
    <AuthGuard>
      <ContractsContent />
    </AuthGuard>
  )
}

function ContractsContent() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContracts()
      .then(setContracts)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-muted">加载中...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">我的契约</h1>
          <p className="mt-1 text-sm text-muted">与他人的约定 · 条款说到做到</p>
        </div>
        <Link href="/create" className="btn-primary px-4 py-2 text-sm">
          创建契约
        </Link>
      </div>
      <div className="space-y-4">
        {contracts.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
        {contracts.length === 0 && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">还没有契约</p>
            <p className="mt-2 text-sm text-muted">
              契约是和别人一起守的约定。也可以先从带奖励的目标开始。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/create" className="btn-primary inline-block px-4 py-2 text-sm">
                去创建
              </Link>
              <Link
                href="/goals"
                className="inline-block rounded border border-line px-4 py-2 text-sm font-semibold hover:border-ink"
              >
                先看目标
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
