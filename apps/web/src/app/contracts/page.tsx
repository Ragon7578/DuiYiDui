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

  if (loading) return <p className="text-gray-400">加载中...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的契约</h1>
        <Link
          href="/create"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800"
        >
          创建契约
        </Link>
      </div>
      <div className="space-y-4">
        {contracts.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
        {contracts.length === 0 && (
          <p className="text-sm text-gray-400">还没有契约。</p>
        )}
      </div>
    </div>
  )
}
