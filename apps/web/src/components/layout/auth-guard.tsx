"use client"

import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted">加载中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="animate-rise flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
        <div>
          <p className="font-display text-4xl font-black text-ink">兑一兑</p>
          <p className="mt-3 text-muted">请先登录以查看此页面</p>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary px-5 py-2.5 text-sm">
            登录
          </Link>
          <Link
            href="/register"
            className="rounded border border-line bg-white/70 px-5 py-2.5 text-sm font-semibold hover:border-ink"
          >
            注册
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
