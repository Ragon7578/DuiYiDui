import { describe, expect, it } from "vitest"
import request from "supertest"
import { auth, getTestApp, registerUser } from "./helpers.js"

describe("AI 意图解析", () => {
  it("规则解析目标文本，带出奖励", async () => {
    const { token } = await registerUser("AI用户")
    const res = await request(getTestApp())
      .post("/api/ai/parse")
      .set(auth(token))
      .send({ text: "连续跑步30天，奖励新跑鞋", mode: "goal" })
      .expect(200)

    expect(res.body.mode).toBe("goal")
    expect(res.body.goals?.length).toBeGreaterThan(0)
    expect(res.body.goals[0].reward).toBeTruthy()
  })

  it("空文本拒绝", async () => {
    const { token } = await registerUser("空解析")
    await request(getTestApp())
      .post("/api/ai/parse")
      .set(auth(token))
      .send({ text: "   ", mode: "goal" })
      .expect(400)
  })
})
