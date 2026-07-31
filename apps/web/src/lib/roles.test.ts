import { describe, expect, it } from "vitest"
import {
  parseRoleSet,
  roleSetToCreateMode,
  ROLES,
  superviseUnlockRemaining,
  SUPERVISE_UNLOCK_REQUIRED,
} from "./roles"
import type { UserProfile } from "./types"

function stubUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "u1",
    name: "测试",
    email: null,
    phone: null,
    avatar: null,
    trustScore: 50,
    totalGoals: 0,
    achievedGoals: 0,
    abandonedGoals: 0,
    totalContracts: 0,
    fulfilledContracts: 0,
    breachedContracts: 0,
    bio: "",
    superviseUnlocked: false,
    superviseUnlockRequired: SUPERVISE_UNLOCK_REQUIRED,
    superviseUnlockProgress: 0,
    superviseUnlockEligible: false,
    superviseUnlockedAt: null,
    ...overrides,
  }
}

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

  it("监督解锁剩余次数", () => {
    expect(superviseUnlockRemaining(stubUser({ superviseUnlockProgress: 1 }))).toBe(2)
    expect(
      superviseUnlockRemaining(
        stubUser({
          superviseUnlocked: true,
          superviseUnlockProgress: 3,
          superviseUnlockEligible: true,
        })
      )
    ).toBe(0)
  })
})
