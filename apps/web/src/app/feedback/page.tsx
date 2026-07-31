"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { useAuth } from "@/lib/auth-context"
import { submitFeedback, track } from "@/lib/analytics"
import { ApiError } from "@/lib/api"
import { FEEDBACK_WINDOW, isFeedbackWindowOpen } from "@/lib/feedback-window"
import { FeedbackWindowBanner } from "@/components/feedback/feedback-window-banner"

export default function FeedbackPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [contact, setContact] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setDone("")
    setLoading(true)
    try {
      const res = await submitFeedback(message.trim(), contact.trim() || undefined)
      track("submit_feedback")
      setDone(res.message)
      setMessage("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-seal">Feedback</p>
        <h1 className="mt-1 font-display text-3xl font-black">意见反馈</h1>
        <p className="mt-2 text-sm text-muted">
          {isFeedbackWindowOpen()
            ? `第 1 波反馈窗（${FEEDBACK_WINDOW.startLabel}～${FEEDBACK_WINDOW.endLabel}）：重点听你怎么用主闭环。`
            : "初版上线，重点是听你怎么用。卡点、看不懂、想要的功能，都欢迎直接说。"}
        </p>
      </div>

      {isFeedbackWindowOpen() && <FeedbackWindowBanner compact />}

      {isFeedbackWindowOpen() && (
        <ul className="space-y-1.5 border-l-2 border-seal/40 pl-3 text-sm text-muted">
          {FEEDBACK_WINDOW.askHints.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">
              {error}
            </p>
          )}
          {done && (
            <p className="rounded border border-ok/20 bg-ok-soft px-3 py-2 text-sm text-ok">{done}</p>
          )}
          <div>
            <FormLabel required>你的想法</FormLabel>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              minLength={5}
              maxLength={2000}
              placeholder="例如：注册后不知道下一步该做什么…"
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>联系方式（选填）</FormLabel>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={user?.email || "邮箱 / 微信，方便我们追问"}
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
            {loading ? "提交中..." : "提交反馈"}
          </button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted">
        <Link href="/" className="font-semibold text-seal hover:underline">
          返回首页
        </Link>
      </p>
    </div>
  )
}
