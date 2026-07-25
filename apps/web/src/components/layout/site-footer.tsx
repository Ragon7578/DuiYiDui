"use client"

import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line/80 bg-white/40">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs">
          兑一兑 · 初版 · 做到了就兑 ·{" "}
          <span className="text-ink/70">欢迎反馈，帮助我们改进</span>
        </p>
        <nav className="flex flex-wrap gap-4 text-xs font-semibold">
          <Link href="/feedback" className="text-seal hover:underline">
            意见反馈
          </Link>
          <Link href="/privacy" className="hover:text-ink hover:underline">
            隐私政策
          </Link>
          <Link href="/terms" className="hover:text-ink hover:underline">
            用户协议
          </Link>
        </nav>
      </div>
    </footer>
  )
}
