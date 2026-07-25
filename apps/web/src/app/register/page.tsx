"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api"

export default function RegisterPage() {
  const { register, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) router.replace("/")
  }, [authLoading, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    if (password.length < 6) {
      setError("密码至少 6 位")
      return
    }

    setLoading(true)
    try {
      await register(username.trim(), password, confirmPassword)
      router.push("/create?onboarding=1")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "注册失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="animate-rise text-center">
        <p className="font-display text-4xl font-black tracking-tight text-ink">
          兑一兑
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">注册</h1>
        <p className="mt-2 text-sm text-muted">用户名 + 密码即可开始。写下目标与奖励，说到做到。</p>
      </div>

      <Card className="animate-rise-delay-1">
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          {error && (
            <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">
              {error}
            </p>
          )}
          <div>
            <FormLabel required>用户名</FormLabel>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="2-20 位，中文/字母/数字"
              className="input-field"
              required
              minLength={2}
              maxLength={20}
            />
          </div>
          <div>
            <FormLabel required>密码</FormLabel>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              minLength={6}
              className="input-field"
              required
            />
            <p className="mt-1 text-xs text-muted">密码 bcrypt 加密存储</p>
          </div>
          <div>
            <FormLabel required>确认密码</FormLabel>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再输入一次密码"
              minLength={6}
              className="input-field"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {loading ? "注册中..." : "注册并创建第一个目标"}
          </button>
          <p className="text-center text-xs text-muted">
            注册即表示你已阅读{" "}
            <Link href="/terms" className="text-seal hover:underline">
              用户协议
            </Link>{" "}
            与{" "}
            <Link href="/privacy" className="text-seal hover:underline">
              隐私政策
            </Link>
          </p>
        </form>
      </Card>

      <p className="animate-rise-delay-2 text-center text-sm text-muted">
        已有账号？{" "}
        <Link href="/login" className="font-semibold text-seal hover:underline">
          去登录
        </Link>
      </p>
    </div>
  )
}
