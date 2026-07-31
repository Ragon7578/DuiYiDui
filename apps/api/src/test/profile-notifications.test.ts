import { describe, expect, it } from "vitest"
import request from "supertest"
import { auth, getTestApp, registerUser, unlockSuperviseForTest } from "./helpers.js"

describe("资料与通知", () => {
  it("资料可更新邮箱手机；登录名不可改", async () => {
    const { token, user } = await registerUser("资料主人")

    const updated = await request(getTestApp())
      .patch("/api/profile")
      .set(auth(token))
      .send({ email: "owner@example.com", phone: "13800138000", bio: "说到做到" })
      .expect(200)

    expect(updated.body.name).toBe(user.name)
    expect(updated.body.email).toBe("owner@example.com")
    expect(updated.body.phone).toBe("13800138000")
    expect(updated.body.bio).toBe("说到做到")
  })

  it("统计含自我承诺与约定计数", async () => {
    const a = await registerUser("统计甲")
    const b = await registerUser("统计乙")

    await request(getTestApp())
      .post("/api/goals")
      .set(auth(a.token))
      .send({ title: "阅读", reward: "新书" })
      .expect(201)

    await unlockSuperviseForTest(a.token)

    await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "互督",
        parties: [{ id: b.user.id }],
        clauses: [{ content: "每周复盘" }],
      })
      .expect(201)

    const stats = await request(getTestApp())
      .get("/api/profile/stats")
      .set(auth(a.token))
      .expect(200)

    expect(stats.body.totalGoals).toBe(4)
    expect(stats.body.activeGoals).toBe(1)
    expect(stats.body.totalContracts).toBe(1)
    expect(stats.body.activeContracts).toBe(1)
  })

  it("通知仅本人可见；可标记已读", async () => {
    const owner = await registerUser("通知主")
    const witness = await registerUser("通知见证")

    const goal = await request(getTestApp())
      .post("/api/goals")
      .set(auth(owner.token))
      .send({ title: "冥想", reward: "香薰" })
      .expect(201)

    await request(getTestApp())
      .post(`/api/goals/${goal.body.id}/witnesses`)
      .set(auth(owner.token))
      .send({ witnessUserId: witness.user.id })
      .expect(201)

    const unread = await request(getTestApp())
      .get("/api/notifications/unread-count")
      .set(auth(witness.token))
      .expect(200)
    expect(unread.body.count).toBeGreaterThanOrEqual(1)

    const list = await request(getTestApp())
      .get("/api/notifications")
      .set(auth(witness.token))
      .expect(200)
    expect(list.body.length).toBeGreaterThanOrEqual(1)

    const noteId = list.body[0].id
    await request(getTestApp())
      .patch(`/api/notifications/${noteId}/read`)
      .set(auth(witness.token))
      .expect(200)

    await request(getTestApp())
      .patch("/api/notifications/read-all")
      .set(auth(witness.token))
      .expect(200)

    const unread2 = await request(getTestApp())
      .get("/api/notifications/unread-count")
      .set(auth(witness.token))
      .expect(200)
    expect(unread2.body.count).toBe(0)

    const ownerNotes = await request(getTestApp())
      .get("/api/notifications")
      .set(auth(owner.token))
      .expect(200)
    expect(ownerNotes.body.every((n: { userId?: string }) => !n.userId || n.userId === owner.user.id)).toBe(
      true
    )
  })

  it("公开反馈可提交", async () => {
    await request(getTestApp())
      .post("/api/feedback")
      .send({ message: "希望增加周报提醒功能，很好用。" })
      .expect(201)
  })

  it("反馈过短拒绝；邮箱格式与重复绑定校验", async () => {
    await request(getTestApp())
      .post("/api/feedback")
      .send({ message: "短" })
      .expect(400)

    const a = await registerUser("邮箱甲")
    const b = await registerUser("邮箱乙")

    await request(getTestApp())
      .patch("/api/profile")
      .set(auth(a.token))
      .send({ email: "not-an-email" })
      .expect(400)

    await request(getTestApp())
      .patch("/api/profile")
      .set(auth(a.token))
      .send({ email: "shared@example.com" })
      .expect(200)

    await request(getTestApp())
      .patch("/api/profile")
      .set(auth(b.token))
      .send({ email: "shared@example.com" })
      .expect(409)
  })

  it("截止日前 3 天生成 goal_deadline，且只生成一次", async () => {
    const { token } = await registerUser("截止用户")
    const deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const created = await request(getTestApp())
      .post("/api/goals")
      .set(auth(token))
      .send({ title: "临期目标", reward: "休息一天", deadline })
      .expect(201)

    await request(getTestApp()).get("/api/profile/stats").set(auth(token)).expect(200)
    await request(getTestApp()).get("/api/notifications").set(auth(token)).expect(200)

    const notes1 = await request(getTestApp()).get("/api/notifications").set(auth(token)).expect(200)
    const deadlines = notes1.body.filter(
      (n: { type: string; relatedId?: string }) =>
        n.type === "goal_deadline" && n.relatedId === created.body.id
    )
    expect(deadlines).toHaveLength(1)

    await request(getTestApp()).get("/api/profile/stats").set(auth(token)).expect(200)
    const notes2 = await request(getTestApp()).get("/api/notifications").set(auth(token)).expect(200)
    const deadlines2 = notes2.body.filter(
      (n: { type: string; relatedId?: string }) =>
        n.type === "goal_deadline" && n.relatedId === created.body.id
    )
    expect(deadlines2).toHaveLength(1)
  })
})
