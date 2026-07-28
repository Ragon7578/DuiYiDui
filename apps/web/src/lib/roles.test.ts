import { describe, expect, it } from "vitest"
import { parseRoleSet, roleSetToCreateMode, ROLES } from "./roles"

describe("角色 IA（我的 / 他人）", () => {
  it("解析 set 参数，兼容旧值", () => {
    expect(parseRoleSet("self")).toBe("self")
    expect(parseRoleSet("goal")).toBe("self")
    expect(parseRoleSet("others")).toBe("others")
    expect(parseRoleSet("supervise")).toBe("others")
    expect(parseRoleSet("contract")).toBe("others")
    expect(parseRoleSet(null)).toBeNull()
    expect(parseRoleSet("unknown")).toBeNull()
  })

  it("角色路由与文案稳定", () => {
    expect(ROLES.self.navLabel).toBe("我的")
    expect(ROLES.others.navLabel).toBe("他人")
    expect(ROLES.self.route).toBe("/goals")
    expect(ROLES.others.route).toBe("/contracts")
    expect(roleSetToCreateMode("self")).toBe("goal")
    expect(roleSetToCreateMode("others")).toBe("contract")
  })
})
