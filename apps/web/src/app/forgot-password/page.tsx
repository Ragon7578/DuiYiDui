"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { forgotPassword } from "@/lib/api-client"
import { ApiError } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [resetUrl, setResetUrl] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setResetUrl("")
    setLoading(true)
    try {
      const res = await forgotPassword(email.trim())
      setMessage(res.message)
      if (res.resetUrl) setResetUrl(res.resetUrl)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "请求失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="animate-rise text-center">
        <p className="font-display text-4xl font-black tracking-tight text-ink">兑一兑</p>
        <h1 className="mt-4 font-display text-2xl font-bold">找回密码</h1>
        <p className="mt-2 text-sm text-muted">
          请输入你在个人资料中绑定的邮箱
        </p>
      </div>

      <Card className="animate-rise-delay-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
          )}
          {message && (
            <p className="rounded border border-ok/20 bg-ok-soft px-3 py-2 text-sm text-ok">{message}</p>
          )}
          <div>
            <FormLabel required>邮箱</FormLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="已绑定的邮箱"
              className="input-field"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
            {loading ? "提交中..." : "获取重置链接"}
          </button>
        </form>

        {resetUrl && (
          <div className="mt-4 rounded border border-line bg-paper-deep/50 p-3 text-sm">
            <p className="mb-2 text-muted">试验环境：重置链接如下（正式环境将发送到邮箱）</p>
            <Link href={resetUrl} className="break-all font-semibold text-seal hover:underline">
              {resetUrl}
            </Link>
          </div>
        )}
      </Card>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-seal hover:underline">返回登录</Link>
        {" · "}
        尚未绑定邮箱？登录后在「我的」中补充
      </p>
    </div>
  )
}
