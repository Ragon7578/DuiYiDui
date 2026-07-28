"use client"

import { useEffect, useState } from "react"
import { fetchUsers } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import type { AuthUser } from "@/lib/types"

/** 已注册用户列表，排除当前用户与额外 id（用于见证人 / 监督对方选择） */
export function useOtherUsers(excludeUserIds: string[] = []): AuthUser[] {
  const { user } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const excludeKey = [user?.id, ...excludeUserIds].filter(Boolean).join(",")

  useEffect(() => {
    const excluded = new Set(excludeKey.split(",").filter(Boolean))
    fetchUsers()
      .then((list) => setUsers(list.filter((u) => !excluded.has(u.id))))
      .catch(() => setUsers([]))
  }, [excludeKey])

  return users
}
