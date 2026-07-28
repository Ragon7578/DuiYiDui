import type { Request, Response, NextFunction } from "express"
import { getSuperviseUnlockStatus } from "../services/user-profile.js"

export function requireSuperviseUnlocked(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const status = getSuperviseUnlockStatus(userId)
  if (!status.unlocked) {
    res.status(403).json({
      error: `请先完成 ${status.required} 个给自己的项目并申请解锁他人角色`,
      code: "SUPERVISE_LOCKED",
      required: status.required,
      progress: status.progress,
      eligible: status.eligible,
    })
    return
  }
  next()
}
