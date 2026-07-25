"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { resetPassword } from "@/lib/api-client"
import { ApiError } from "@/lib/api"

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!token) {
      setError("重置链接无效")
      return
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password, confirmPassword)
      setDone(true)
      setTimeout(() => router.push("/login"), 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "重置失败")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Card>
        <p className="text-sm text-seal">重置链接无效，请重新申请。</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-seal hover:underline">
          去找回密码
        </Link>
      </Card>
    )
  }

  if (done) {
    return (
      <Card>
        <p className="text-sm text-ok">密码已重置，正在跳转登录…</p>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
        )}
        <div>
          <FormLabel required>新密码</FormLabel>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="input-field"
            required
          />
        </div>
        <div>
          <FormLabel required>确认新密码</FormLabel>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            className="input-field"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm">
          {loading ? "提交中..." : "重置密码"}
        </button>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="animate-rise text-center">
        <p className="font-display text-4xl font-black tracking-tight text-ink">契约精神</p>
        <h1 className="mt-4 font-display text-2xl font-bold">重置密码</h1>
      </div>
      <div className="animate-rise-delay-1">
        <Suspense fallback={<p className="text-muted">加载中...</p>}>
          <ResetForm />
        </Suspense>
      </div>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-semibold text-seal hover:underline">返回登录</Link>
      </p>
    </div>
  )
}
