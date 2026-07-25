"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { fetchMe, login as apiLogin, register as apiRegister, clearToken, setToken } from "./api-client"
import { track } from "./analytics"
import type { UserProfile } from "./types"

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, confirmPassword?: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const profile = await fetchMe()
      setUser(profile)
    } catch {
      setUser(null)
      clearToken()
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("cs_token")
    if (token) {
      refresh().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [refresh])

  async function login(username: string, password: string) {
    const res = await apiLogin(username, password)
    setToken(res.token)
    setUser(res.user)
    track("login")
  }

  async function register(
    username: string,
    password: string,
    confirmPassword?: string
  ) {
    const res = await apiRegister(username, password, confirmPassword)
    setToken(res.token)
    setUser(res.user)
    track("register")
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
