/** 解锁「他人 / 监督」角色：须先履行一定数量的给自己的项目（达成计数） */
export const SUPERVISE_UNLOCK_REQUIRED = Number(
  process.env.SUPERVISE_UNLOCK_REQUIRED || "3"
)
