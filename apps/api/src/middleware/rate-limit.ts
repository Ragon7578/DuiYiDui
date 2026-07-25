import type { Request, Response, NextFunction } from "express"

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Simple in-memory rate limit (single instance). */
export function rateLimit(options: {
  windowMs: number
  max: number
  key?: (req: Request) => string
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = options.key?.(req) || req.ip || "anon"
    const key = `${req.path}:${id}`
    const now = Date.now()
    let b = buckets.get(key)
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + options.windowMs }
      buckets.set(key, b)
    }
    b.count += 1
    if (b.count > options.max) {
      res.status(429).json({ error: "请求过于频繁，请稍后再试" })
      return
    }
    next()
  }
}
