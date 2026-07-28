"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { unlockSuperviseRole } from "@/lib/api-client"
import { ROLES, superviseUnlockRemaining } from "@/lib/roles"
import { ApiError } from "@/lib/api"
import type { UserProfile } from "@/lib/types"

export function SuperviseUnlockGate({ user }: { user: UserProfile }) {
  const { refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const remaining = superviseUnlockRemaining(user)
  const progressPct = Math.min(
    100,
    Math.round((user.superviseUnlockProgress / user.superviseUnlockRequired) * 100)
  )

  async function handleUnlock() {
    setError("")
    setLoading(true)
    try {
      await unlockSuperviseRole()
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "申请失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-lg space-y-5 border-ink/10 bg-white/90 p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-seal">未解锁</p>
      <h2 className="font-display text-2xl font-black tracking-tight">
        {ROLES.others.navLabel}角色待解锁
      </h2>
      <p className="text-sm text-muted">
        先对自己守信，再帮他人盯约定。完成足够数量的「{ROLES.self.projectLabel}」后，可申请解锁
        「{ROLES.others.projectLabel}」。
      </p>

      <div className="text-left">
        <div className="flex justify-between text-sm">
          <span className="text-muted">自身计划已达成</span>
          <span className="font-semibold tabular-nums">
            {user.superviseUnlockProgress} / {user.superviseUnlockRequired}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-deep">
          <div className="h-2 rounded-full bg-seal transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {error && (
        <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
      )}

      {user.superviseUnlockEligible ? (
        <button
          type="button"
          onClick={handleUnlock}
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? "解锁中..." : "申请解锁他人角色"}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            还需完成 <span className="font-semibold text-ink">{remaining}</span> 个给自己的项目。
          </p>
          <Link href={ROLES.self.createHref} className="btn-primary inline-block px-5 py-2.5 text-sm">
            去创建给自己的项目
          </Link>
        </div>
      )}
    </Card>
  )
}
