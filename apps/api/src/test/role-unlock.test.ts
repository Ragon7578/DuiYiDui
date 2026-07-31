import request from "supertest"
import { describe, expect, it } from "vitest"
import { auth, achieveGoalsForTest, getTestApp, registerUser } from "./helpers.js"

async function achieveGoals(token: string, count: number) {
  await achieveGoalsForTest(token, count)
}

describe("他人角色解锁", () => {
  it("新用户默认未解锁，达成 3 个自身计划后可申请解锁", async () => {
    const app = getTestApp()
    const { token } = await registerUser("解锁测试甲")

    const me0 = await request(app).get("/api/auth/me").set(auth(token)).expect(200)
    expect(me0.body.superviseUnlocked).toBe(false)
    expect(me0.body.superviseUnlockRequired).toBe(3)
    expect(me0.body.superviseUnlockProgress).toBe(0)
    expect(me0.body.superviseUnlockEligible).toBe(false)

    await achieveGoalsForTest(token, 2)
    const me1 = await request(app).get("/api/auth/me").set(auth(token)).expect(200)
    expect(me1.body.superviseUnlockProgress).toBe(2)
    expect(me1.body.superviseUnlockEligible).toBe(false)

    const fail = await request(app)
      .post("/api/profile/unlock-supervise")
      .set(auth(token))
      .expect(400)
    expect(fail.body.code).toBe("SUPERVISE_UNLOCK_INELIGIBLE")

    await achieveGoalsForTest(token, 1)
    const me2 = await request(app).get("/api/auth/me").set(auth(token)).expect(200)
    expect(me2.body.superviseUnlockEligible).toBe(true)

    const unlocked = await request(app)
      .post("/api/profile/unlock-supervise")
      .set(auth(token))
      .expect(200)
    expect(unlocked.body.user.superviseUnlocked).toBe(true)
  })

  it("未解锁时不能创建他人项目", async () => {
    const app = getTestApp()
    const a = await registerUser("锁定用户A")
    const b = await registerUser("锁定用户B")

    const res = await request(app)
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "测试约定",
        parties: [{ id: b.user.id, name: b.user.name, role: "promisee" }],
        clauses: [{ content: "条款一" }],
      })
      .expect(403)
    expect(res.body.code).toBe("SUPERVISE_LOCKED")

    await achieveGoals(a.token, 3)
    await request(app).post("/api/profile/unlock-supervise").set(auth(a.token)).expect(200)

    await request(app)
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "测试约定",
        parties: [{ id: b.user.id, name: b.user.name, role: "promisee" }],
        clauses: [{ content: "条款一" }],
      })
      .expect(201)
  })

  it("重复解锁幂等", async () => {
    const app = getTestApp()
    const { token } = await registerUser("幂等解锁")
    await achieveGoals(token, 3)
    const first = await request(app).post("/api/profile/unlock-supervise").set(auth(token)).expect(200)
    expect(first.body.user.superviseUnlocked).toBe(true)
    const second = await request(app).post("/api/profile/unlock-supervise").set(auth(token)).expect(200)
    expect(second.body.user.superviseUnlocked).toBe(true)
  })
})
