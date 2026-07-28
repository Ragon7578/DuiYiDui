import { describe, expect, it } from "vitest"
import request from "supertest"
import { auth, getTestApp, registerUser } from "./helpers.js"

describe("我的 · 自我承诺闭环", () => {
  it("创建要求 title 与 reward", async () => {
    const { token } = await registerUser("承诺主人")
    await request(getTestApp())
      .post("/api/goals")
      .set(auth(token))
      .send({ title: "跑步" })
      .expect(400)
  })

  it("创建 → 进度 100 → 达成 → 兑现奖励", async () => {
    const { token, user } = await registerUser("闭环用户")

    const created = await request(getTestApp())
      .post("/api/goals")
      .set(auth(token))
      .send({ title: "连续跑步30天", reward: "新跑鞋", description: "每天5km" })
      .expect(201)

    expect(created.body.status).toBe("active")
    expect(created.body.reward).toBe("新跑鞋")
    expect(created.body.progress).toBe(0)

    const achieved = await request(getTestApp())
      .patch(`/api/goals/${created.body.id}`)
      .set(auth(token))
      .send({ progress: 100 })
      .expect(200)

    expect(achieved.body.status).toBe("achieved")
    expect(achieved.body.progress).toBe(100)
    expect(achieved.body.achievedAt).toBeTruthy()

    const me = await request(getTestApp()).get("/api/auth/me").set(auth(token)).expect(200)
    expect(me.body.trustScore).toBe(user.trustScore + 5)
    expect(me.body.achievedGoals).toBe(1)

    const claimed = await request(getTestApp())
      .post(`/api/goals/${created.body.id}/claim-reward`)
      .set(auth(token))
      .expect(200)
    expect(claimed.body.status).toBe("reward_claimed")
    expect(claimed.body.rewardClaimed).toBe(true)

    await request(getTestApp())
      .post(`/api/goals/${created.body.id}/claim-reward`)
      .set(auth(token))
      .expect(400)
  })

  it("未达成不能兑奖；放弃扣信任分", async () => {
    const { token, user } = await registerUser("放弃用户")
    const created = await request(getTestApp())
      .post("/api/goals")
      .set(auth(token))
      .send({ title: "早睡", reward: "周末电影" })
      .expect(201)

    await request(getTestApp())
      .post(`/api/goals/${created.body.id}/claim-reward`)
      .set(auth(token))
      .expect(400)

    await request(getTestApp())
      .patch(`/api/goals/${created.body.id}`)
      .set(auth(token))
      .send({ status: "abandoned" })
      .expect(200)

    const me = await request(getTestApp()).get("/api/auth/me").set(auth(token)).expect(200)
    expect(me.body.trustScore).toBe(user.trustScore - 5)
    expect(me.body.abandonedGoals).toBe(1)
  })

  it("用户隔离：看不到他人承诺", async () => {
    const owner = await registerUser("主人")
    const other = await registerUser("外人")

    const created = await request(getTestApp())
      .post("/api/goals")
      .set(auth(owner.token))
      .send({ title: "私密目标", reward: "咖啡" })
      .expect(201)

    const list = await request(getTestApp())
      .get("/api/goals")
      .set(auth(other.token))
      .expect(200)
    expect(list.body).toHaveLength(0)

    await request(getTestApp())
      .get(`/api/goals/${created.body.id}`)
      .set(auth(other.token))
      .expect(404)
  })

  it("见证人邀请 → 确认 → 达成时 +3 信任分", async () => {
    const owner = await registerUser("目标主")
    const witness = await registerUser("见证人")

    const goal = await request(getTestApp())
      .post("/api/goals")
      .set(auth(owner.token))
      .send({ title: "戒糖一周", reward: "蛋糕" })
      .expect(201)

    const invited = await request(getTestApp())
      .post(`/api/goals/${goal.body.id}/witnesses`)
      .set(auth(owner.token))
      .send({ witnessUserId: witness.user.id })
      .expect(201)
    expect(invited.body.status).toBe("pending")

    await request(getTestApp())
      .post(`/api/goals/${goal.body.id}/witnesses`)
      .set(auth(owner.token))
      .send({ witnessUserId: witness.user.id })
      .expect(409)

    await request(getTestApp())
      .patch(`/api/goals/${goal.body.id}/witnesses/${invited.body.id}`)
      .set(auth(witness.token))
      .send({ status: "confirmed" })
      .expect(200)

    await request(getTestApp())
      .patch(`/api/goals/${goal.body.id}`)
      .set(auth(owner.token))
      .send({ progress: 100 })
      .expect(200)

    const witnessMe = await request(getTestApp())
      .get("/api/auth/me")
      .set(auth(witness.token))
      .expect(200)
    expect(witnessMe.body.trustScore).toBe(witness.user.trustScore + 3)

    const notes = await request(getTestApp())
      .get("/api/notifications")
      .set(auth(witness.token))
      .expect(200)
    expect(notes.body.some((n: { type: string }) => n.type === "witness_invite")).toBe(true)
    expect(notes.body.some((n: { type: string }) => n.type === "goal_achieved")).toBe(true)
  })
})
