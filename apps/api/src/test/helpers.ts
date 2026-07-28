import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import request from "supertest"
import type { Express } from "express"
import { afterEach, beforeEach } from "vitest"
import { closeDb } from "../db/schema.js"
import { clearRateLimitBuckets } from "../middleware/rate-limit.js"

let app: Express
let dbFile: string

export function getTestApp(): Express {
  return app
}

export async function registerUser(
  username: string,
  password = "password123"
): Promise<{ token: string; user: { id: string; name: string; trustScore: number } }> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password, confirmPassword: password })
    .expect(201)
  return res.body
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

/** 测试用：达成 N 个自身计划（标记 achieved） */
export async function achieveGoalsForTest(token: string, count: number) {
  const app = getTestApp()
  for (let i = 0; i < count; i++) {
    const created = await request(app)
      .post("/api/goals")
      .set(auth(token))
      .send({ title: `解锁计划${i + 1}`, reward: "奖励" })
      .expect(201)
    await request(app)
      .patch(`/api/goals/${created.body.id}`)
      .set(auth(token))
      .send({ status: "achieved", progress: 100 })
      .expect(200)
  }
}

/** 测试用：补足达成数并解锁他人角色 */
export async function unlockSuperviseForTest(token: string, required = 3) {
  const app = getTestApp()
  const me = await request(app).get("/api/auth/me").set(auth(token)).expect(200)
  const need = Math.max(0, required - (me.body.superviseUnlockProgress as number))
  if (need > 0) await achieveGoalsForTest(token, need)
  await request(app).post("/api/profile/unlock-supervise").set(auth(token)).expect(200)
}

beforeEach(async () => {
  clearRateLimitBuckets()
  closeDb()

  dbFile = path.join(os.tmpdir(), `dui-yi-dui-test-${process.pid}-${Date.now()}.db`)
  process.env.DB_PATH = dbFile
  process.env.NODE_ENV = "test"
  process.env.JWT_SECRET = "test-jwt-secret-dui-yi-dui"

  // 动态导入，确保 getDb 读到新的 DB_PATH
  const { createApp } = await import("../app.js")
  app = createApp()
})

afterEach(() => {
  closeDb()
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = dbFile + suffix
    if (fs.existsSync(p)) fs.unlinkSync(p)
  }
})
