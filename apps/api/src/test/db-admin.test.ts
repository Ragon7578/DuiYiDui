import { describe, expect, it } from "vitest"
import request from "supertest"
import { getTestApp, registerUser } from "./helpers.js"

describe("数据库运维接口", () => {
  it("未配置管理员密钥时返回 503", async () => {
    await request(getTestApp()).get("/api/db/health").expect(503)
  })

  it("正确密钥可查看 health 与 stats", async () => {
    process.env.FEEDBACK_ADMIN_KEY = "test-admin-key"
    await registerUser("库用户")

    await request(getTestApp()).get("/api/db/health").expect(401)

    const health = await request(getTestApp())
      .get("/api/db/health")
      .set("x-feedback-admin-key", "test-admin-key")
      .expect(200)
    expect(health.body.ok).toBe(true)

    const stats = await request(getTestApp())
      .get("/api/db/stats")
      .set("x-feedback-admin-key", "test-admin-key")
      .expect(200)
    expect(stats.body.tables.users).toBeGreaterThanOrEqual(1)
  })
})
