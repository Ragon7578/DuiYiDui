"use client"

import type { AuthUser } from "@/lib/types"

type UserSelectProps = {
  value: string
  onChange: (userId: string) => void
  users: AuthUser[]
  placeholder?: string
  emptyLabel?: string
  className?: string
}

export function UserSelect({
  value,
  onChange,
  users,
  placeholder = "选择已注册用户",
  emptyLabel,
  className = "input-field",
}: UserSelectProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{emptyLabel ?? placeholder}</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  )
}
