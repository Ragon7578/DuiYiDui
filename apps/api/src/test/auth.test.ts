import { describe, expect, it } from "vitest"
import request from "supertest"
import { auth, getTestApp, registerUser } from "./helpers.js"

describe("健康检查与认证", () => {
  it("GET /api/health 返回 ok", async () => {
    const res = await request(getTestApp()).get("/api/health").expect(200)
    expect(res.body.status).toBe("ok")
    expect(res.body.version).toBeTruthy()
  })

  it("注册成功返回 JWT 与资料", async () => {
    const body = await registerUser("测试用户甲")
    expect(body.token).toBeTruthy()
    expect(body.user.name).toBe("测试用户甲")
    expect(body.user.trustScore).toBe(50)
  })

  it("拒绝非法用户名与短密码", async () => {
    await request(getTestApp())
      .post("/api/auth/register")
      .send({ username: "a", password: "password123", confirmPassword: "password123" })
      .expect(400)

    await request(getTestApp())
      .post("/api/auth/register")
      .send({ username: "合法用户", password: "123", confirmPassword: "123" })
      .expect(400)
  })

  it("拒绝重复用户名", async () => {
    await registerUser("重复用户")
    await request(getTestApp())
      .post("/api/auth/register")
      .send({ username: "重复用户", password: "password123", confirmPassword: "password123" })
      .expect(409)
  })

  it("登录成功与失败", async () => {
    await registerUser("登录用户")
    const ok = await request(getTestApp())
      .post("/api/auth/login")
      .send({ username: "登录用户", password: "password123" })
      .expect(200)
    expect(ok.body.token).toBeTruthy()

    await request(getTestApp())
      .post("/api/auth/login")
      .send({ username: "登录用户", password: "wrong-password" })
      .expect(401)
  })

  it("GET /api/auth/me 需要有效 JWT", async () => {
    const { token } = await registerUser("资料用户")
    const me = await request(getTestApp())
      .get("/api/auth/me")
      .set(auth(token))
      .expect(200)
    expect(me.body.name).toBe("资料用户")

    await request(getTestApp()).get("/api/auth/me").expect(401)
  })

  it("GET /api/auth/users 返回其他真实用户列表", async () => {
    const a = await registerUser("用户甲")
    await registerUser("用户乙")
    const res = await request(getTestApp())
      .get("/api/auth/users")
      .set(auth(a.token))
      .expect(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.some((u: { name: string }) => u.name === "用户乙")).toBe(true)
  })
})
