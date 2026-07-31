import { Router } from "express"
import type { Request, Response, NextFunction } from "express"
import { checkDbHealth, getDbStats } from "../db/maintenance.js"
import { rateLimit } from "../middleware/rate-limit.js"

const router = Router()

function requireDbAdmin(req: Request, res: Response, next: NextFunction): void {
  const key = (process.env.FEEDBACK_ADMIN_KEY || process.env.DB_ADMIN_KEY || "").trim()
  if (!key) {
    res.status(503).json({ error: "未配置 FEEDBACK_ADMIN_KEY 或 DB_ADMIN_KEY" })
    return
  }
  const provided =
    String(req.headers["x-feedback-admin-key"] || req.headers["x-db-admin-key"] || "") ||
    String(req.query.key || "")
  if (provided !== key) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  next()
}

router.get(
  "/health",
  rateLimit({ windowMs: 60_000, max: 30 }),
  requireDbAdmin,
  (_req, res) => {
    res.json(checkDbHealth())
  }
)

router.get(
  "/stats",
  rateLimit({ windowMs: 60_000, max: 30 }),
  requireDbAdmin,
  (_req, res) => {
    res.json(getDbStats())
  }
)

export default router
