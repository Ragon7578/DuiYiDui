"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/api"

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) router.replace("/")
  }, [authLoading, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(username.trim(), password)
      router.push("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "登录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div className="animate-rise text-center">
        <p className="font-display text-4xl font-black tracking-tight text-ink">
          契约精神
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">登录</h1>
        <p className="mt-2 text-sm text-muted">试验功能 · 用户名 + 密码即可</p>
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
              placeholder="请输入用户名"
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="input-field"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {loading ? "登录中..." : "登录"}
          </button>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted hover:text-seal">
              忘记密码？
            </Link>
          </p>
        </form>
      </Card>

      <p className="animate-rise-delay-2 text-center text-sm text-muted">
        还没有账号？{" "}
        <Link href="/register" className="font-semibold text-seal hover:underline">
          注册一个
        </Link>
      </p>
    </div>
  )
}
