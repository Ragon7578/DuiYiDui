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
import { getDb } from "./db/schema.js"

const app = express()
const PORT = Number(process.env.PORT) || 4000

const frontendOrigin = process.env.FRONTEND_ORIGIN
app.use(cors(frontendOrigin ? { origin: frontendOrigin } : undefined))
app.use(express.json({ limit: "64kb" }))

// Ensure DB schema ready on boot
getDb()

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("[warn] JWT_SECRET is not set — using insecure default. Set JWT_SECRET before public launch.")
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "initial-fast-launch",
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

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" })
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DuiYiDui API running at http://0.0.0.0:${PORT}`)
}).on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[fatal] 端口 ${PORT} 已被占用。请先执行: npm run stop\n` +
        `或手动: lsof -ti:${PORT} | xargs kill -9`
    )
    process.exit(1)
  }
  throw err
})
