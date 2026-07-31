import { describe, expect, it } from "vitest"
import request from "supertest"
import { auth, getTestApp, registerUser, unlockSuperviseForTest } from "./helpers.js"

describe("他人 · 监督约定", () => {
  it("创建要求标题、真实对方与条款", async () => {
    const a = await registerUser("约定甲")
    await registerUser("约定乙")
    await unlockSuperviseForTest(a.token)

    await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({ title: "互督学习", parties: [], clauses: [{ content: "每天学习1小时" }] })
      .expect(400)

    await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "互督学习",
        parties: [{ name: "约定甲" }],
        clauses: [{ content: "每天学习1小时" }],
      })
      .expect(400)

    await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({ title: "互督学习", parties: [{ name: "约定乙" }], clauses: [] })
      .expect(400)
  })

  it("双方可见；非参与方 404", async () => {
    const a = await registerUser("参与甲")
    const b = await registerUser("参与乙")
    const c = await registerUser("路人")

    await unlockSuperviseForTest(a.token)

    const created = await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "健身互督",
        parties: [{ name: "参与乙" }],
        clauses: [{ content: "每周运动3次" }],
      })
      .expect(201)

    expect(created.body.status).toBe("active")
    expect(created.body.parties.length).toBe(2)

    await request(getTestApp())
      .get(`/api/contracts/${created.body.id}`)
      .set(auth(b.token))
      .expect(200)

    await request(getTestApp())
      .get(`/api/contracts/${created.body.id}`)
      .set(auth(c.token))
      .expect(404)

    const listB = await request(getTestApp())
      .get("/api/contracts")
      .set(auth(b.token))
      .expect(200)
    expect(listB.body).toHaveLength(1)
  })

  it("全部条款履约 → completed，各方信任分 +10（幂等）", async () => {
    const a = await registerUser("履约甲")
    const b = await registerUser("履约乙")

    await unlockSuperviseForTest(a.token)

    const created = await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "早起约定",
        parties: [{ id: b.user.id }],
        clauses: [{ content: "周一到周五 7 点起" }, { content: "周末不睡懒觉" }],
      })
      .expect(201)

    const [c1, c2] = created.body.clauses
    const beforeA = await request(getTestApp()).get("/api/auth/me").set(auth(a.token)).expect(200)
    const beforeB = await request(getTestApp()).get("/api/auth/me").set(auth(b.token)).expect(200)

    const afterOne = await request(getTestApp())
      .patch(`/api/contracts/${created.body.id}/clauses/${c1.id}`)
      .set(auth(a.token))
      .send({ status: "fulfilled" })
      .expect(200)
    expect(afterOne.body.status).toBe("active")

    const completed = await request(getTestApp())
      .patch(`/api/contracts/${created.body.id}/clauses/${c2.id}`)
      .set(auth(a.token))
      .send({ status: "fulfilled" })
      .expect(200)
    expect(completed.body.status).toBe("completed")

    const meA = await request(getTestApp()).get("/api/auth/me").set(auth(a.token)).expect(200)
    const meB = await request(getTestApp()).get("/api/auth/me").set(auth(b.token)).expect(200)
    expect(meA.body.trustScore).toBe(beforeA.body.trustScore + 10)
    expect(meB.body.trustScore).toBe(beforeB.body.trustScore + 10)
    expect(meA.body.fulfilledContracts).toBe(1)

    // 重复标记已履约条款不应再次加分
    await request(getTestApp())
      .patch(`/api/contracts/${created.body.id}/clauses/${c2.id}`)
      .set(auth(a.token))
      .send({ status: "fulfilled" })
      .expect(200)

    const meA2 = await request(getTestApp()).get("/api/auth/me").set(auth(a.token)).expect(200)
    expect(meA2.body.trustScore).toBe(meA.body.trustScore)
    expect(meA2.body.fulfilledContracts).toBe(1)
  })

  it("任一条款违约 → breached，各方信任分 -15", async () => {
    const a = await registerUser("违约甲")
    const b = await registerUser("违约乙")

    await unlockSuperviseForTest(a.token)

    const created = await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "戒烟互督",
        parties: [{ name: "违约乙" }],
        clauses: [{ content: "本月不吸烟" }],
      })
      .expect(201)

    const clauseId = created.body.clauses[0].id
    const beforeA = await request(getTestApp()).get("/api/auth/me").set(auth(a.token)).expect(200)
    const beforeB = await request(getTestApp()).get("/api/auth/me").set(auth(b.token)).expect(200)

    const breached = await request(getTestApp())
      .patch(`/api/contracts/${created.body.id}/clauses/${clauseId}`)
      .set(auth(b.token))
      .send({ status: "breached" })
      .expect(200)

    expect(breached.body.status).toBe("breached")

    const meA = await request(getTestApp()).get("/api/auth/me").set(auth(a.token)).expect(200)
    const meB = await request(getTestApp()).get("/api/auth/me").set(auth(b.token)).expect(200)
    expect(meA.body.trustScore).toBe(beforeA.body.trustScore - 15)
    expect(meB.body.trustScore).toBe(beforeB.body.trustScore - 15)
    expect(meA.body.breachedContracts).toBe(1)
  })

  it("可更新标题；删除后双方不可见", async () => {
    const a = await registerUser("编辑甲")
    const b = await registerUser("编辑乙")
    await unlockSuperviseForTest(a.token)

    const created = await request(getTestApp())
      .post("/api/contracts")
      .set(auth(a.token))
      .send({
        title: "旧标题",
        parties: [{ id: b.user.id }],
        clauses: [{ content: "每周复盘" }],
      })
      .expect(201)

    const updated = await request(getTestApp())
      .patch(`/api/contracts/${created.body.id}`)
      .set(auth(a.token))
      .send({ title: "新标题" })
      .expect(200)
    expect(updated.body.title).toBe("新标题")

    await request(getTestApp())
      .delete(`/api/contracts/${created.body.id}`)
      .set(auth(a.token))
      .expect(204)

    await request(getTestApp())
      .get(`/api/contracts/${created.body.id}`)
      .set(auth(a.token))
      .expect(404)
    await request(getTestApp())
      .get(`/api/contracts/${created.body.id}`)
      .set(auth(b.token))
      .expect(404)
  })
})
