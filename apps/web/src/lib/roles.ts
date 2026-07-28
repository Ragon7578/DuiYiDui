/** 产品双角色：给自己的项目 / 给别人的项目（工程仍用 goals / contracts） */

import type { UserProfile } from "./types"

export type RoleSet = "self" | "others"

export const ROLES = {
  self: {
    set: "self" as const,
    navLabel: "我的",
    projectLabel: "给自己的项目",
    shortLabel: "我的项目",
    createLabel: "给自己的项目",
    route: "/goals",
    createHref: "/create?set=self",
    description: "对自己立承诺、绑奖励，做到了去兑现",
  },
  others: {
    set: "others" as const,
    navLabel: "他人",
    projectLabel: "给别人的项目",
    shortLabel: "他人项目",
    createLabel: "给别人的项目",
    route: "/contracts",
    createHref: "/create?set=others",
    description: "与他人约定、见证别人说到做到（至少两名真实用户）",
  },
} as const

/** 解析 URL `?set=`；兼容旧值 supervise / contract / goal */
export function parseRoleSet(param: string | null): RoleSet | null {
  if (!param) return null
  if (param === "self" || param === "goal") return "self"
  if (param === "others" || param === "supervise" || param === "contract") return "others"
  return null
}

/** 解锁他人（监督）角色：须先达成足够数量的给自己的项目 */
export const SUPERVISE_UNLOCK_REQUIRED = 3

export function superviseUnlockRemaining(user: UserProfile): number {
  return Math.max(0, user.superviseUnlockRequired - user.superviseUnlockProgress)
}

export function roleSetToCreateMode(set: RoleSet): "goal" | "contract" {
  return set === "self" ? "goal" : "contract"
}
