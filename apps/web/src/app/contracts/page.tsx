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
          <h1 className="font-display text-3xl font-black tracking-tight">监督</h1>
          <p className="mt-1 text-sm text-muted">盯他人说到做到 · 需要真实账号参与</p>
        </div>
        <Link href="/create?set=supervise" className="btn-primary px-4 py-2 text-sm">
          创建
        </Link>
      </div>
      <div className="space-y-4">
        {contracts.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
        {contracts.length === 0 && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">还没有监督约定</p>
            <p className="mt-2 text-sm text-muted">找一个真实用户一起立约，盯着说到做到。</p>
            <Link
              href="/create?set=supervise"
              className="btn-primary mt-4 inline-block px-4 py-2 text-sm"
            >
              创建监督约定
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
