import { getDb } from "../db/schema.js"

export interface UserRef {
  userId: string
  name: string
}

export function getUserById(id: string): UserRef | null {
  const row = getDb()
    .prepare("SELECT id, name FROM users WHERE id = ?")
    .get(id) as { id: string; name: string } | undefined
  return row ? { userId: row.id, name: row.name } : null
}

/** 监督侧参与方须为真实用户：按 id 或登录名解析 */
export function resolveUserRef(ref: { id?: string; name?: string }): UserRef | null {
  if (ref.id) {
    const byId = getUserById(ref.id)
    if (byId) return byId
  }
  const name = ref.name?.trim()
  if (name) {
    const row = getDb()
      .prepare("SELECT id, name FROM users WHERE name = ?")
      .get(name) as { id: string; name: string } | undefined
    if (row) return { userId: row.id, name: row.name }
  }
  return null
}
