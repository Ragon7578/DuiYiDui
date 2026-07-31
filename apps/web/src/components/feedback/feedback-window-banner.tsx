"use client"

import Link from "next/link"
import { FEEDBACK_WINDOW, isFeedbackWindowOpen } from "@/lib/feedback-window"

export function FeedbackWindowBanner({ compact = false }: { compact?: boolean }) {
  if (!isFeedbackWindowOpen()) return null

  if (compact) {
    return (
      <p className="rounded border border-seal/25 bg-seal-soft/40 px-3 py-2 text-xs text-ink">
        <span className="font-semibold text-seal">反馈窗 {FEEDBACK_WINDOW.startLabel}～{FEEDBACK_WINDOW.endLabel}</span>
        {" · "}
        {FEEDBACK_WINDOW.blurb}
      </p>
    )
  }

  return (
    <aside className="animate-rise rounded border border-seal/30 bg-seal-soft/35 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seal">
            Open window · {FEEDBACK_WINDOW.startLabel} → {FEEDBACK_WINDOW.endLabel}
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-ink sm:text-xl">
            {FEEDBACK_WINDOW.title}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{FEEDBACK_WINDOW.blurb}</p>
        </div>
        <Link href="/feedback" className="btn-primary shrink-0 px-4 py-2 text-sm">
          写下意见
        </Link>
      </div>
    </aside>
  )
}
