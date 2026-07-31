"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ContractCard } from "@/components/contract/contract-card"
import { AuthGuard } from "@/components/layout/auth-guard"
import { SuperviseUnlockGate } from "@/components/roles/supervise-unlock-gate"
import { useAuth } from "@/lib/auth-context"
import { fetchContracts } from "@/lib/api-client"
import { ROLES } from "@/lib/roles"
import type { Contract } from "@/lib/types"

export default function ContractsPage() {
  return (
    <AuthGuard>
      <ContractsContent />
    </AuthGuard>
  )
}

function ContractsContent() {
  const { user } = useAuth()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContracts()
      .then(setContracts)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !user) return <p className="text-muted">加载中...</p>

  const locked = !user.superviseUnlocked

  if (locked && contracts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">{ROLES.others.navLabel}</h1>
          <p className="mt-1 text-sm text-muted">{ROLES.others.projectLabel}</p>
        </div>
        <SuperviseUnlockGate user={user} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">{ROLES.others.navLabel}</h1>
          <p className="mt-1 text-sm text-muted">{ROLES.others.projectLabel} · 需要真实账号参与</p>
        </div>
        {user.superviseUnlocked && (
          <Link href={ROLES.others.createHref} className="btn-primary px-4 py-2 text-sm">
            创建
          </Link>
        )}
      </div>

      {locked && (
        <div className="rounded border border-line bg-paper/50 px-4 py-3 text-sm text-muted">
          你已被邀请参与他人项目。要创建新的给别人的项目，请先
          <Link href={ROLES.self.route} className="font-semibold text-seal hover:underline">
            完成自身计划并解锁
          </Link>
          。
        </div>
      )}

      <div className="space-y-4">
        {contracts.map((c) => (
          <ContractCard key={c.id} contract={c} />
        ))}
        {contracts.length === 0 && user.superviseUnlocked && (
          <div className="rounded border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">还没有他人项目</p>
            <p className="mt-2 text-sm text-muted">找一个真实用户一起立约，盯着说到做到。</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={ROLES.others.createHref}
                className="btn-primary inline-block px-4 py-2 text-sm"
              >
                创建给别人的项目
              </Link>
              <Link
                href={ROLES.self.route}
                className="inline-block rounded border border-line px-4 py-2 text-sm font-semibold hover:border-ink"
              >
                先看「我的」
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
