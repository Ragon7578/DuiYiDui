import express from "express"
import cors from "cors"
import goalsRouter from "./routes/goals.js"
import contractsRouter from "./routes/contracts.js"
import pledgesRouter from "./routes/pledges.js"
import profileRouter from "./routes/profile.js"
import authRouter from "./routes/auth.js"
import notificationsRouter from "./routes/notifications.js"
import aiRouter from "./routes/ai.js"
import feedbackRouter from "./routes/feedback.js"
import eventsRouter from "./routes/events.js"
import dbRouter from "./routes/db.js"
import { getDb } from "./db/schema.js"
import { checkDbHealth } from "./db/maintenance.js"

/** 创建 Express 应用（不监听端口，便于集成测试） */
export function createApp() {
  getDb()

  const app = express()
  const frontendOrigin = process.env.FRONTEND_ORIGIN
  app.use(cors(frontendOrigin ? { origin: frontendOrigin } : undefined))
  app.use(express.json({ limit: "64kb" }))

  app.get("/api/health", (_req, res) => {
    const dbHealth = checkDbHealth()
    const ok = dbHealth.ok
    res.status(ok ? 200 : 503).json({
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: "initial-fast-launch",
      db: {
        ok: dbHealth.ok,
        integrity: dbHealth.integrity,
        schemaVersion: dbHealth.schemaVersion,
        expectedSchemaVersion: dbHealth.expectedSchemaVersion,
        journalMode: dbHealth.journalMode,
      },
    })
  })

  app.use("/api/auth", authRouter)
  app.use("/api/goals", goalsRouter)
  app.use("/api/contracts", contractsRouter)
  app.use("/api/pledges", pledgesRouter)
  app.use("/api/profile", profileRouter)
  app.use("/api/notifications", notificationsRouter)
  app.use("/api/ai", aiRouter)
  app.use("/api/feedback", feedbackRouter)
  app.use("/api/events", eventsRouter)
  app.use("/api/db", dbRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" })
  })

  return app
}
