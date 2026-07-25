import express from "express"
import cors from "cors"
import goalsRouter from "./routes/goals.js"
import contractsRouter from "./routes/contracts.js"
import pledgesRouter from "./routes/pledges.js"
import profileRouter from "./routes/profile.js"
import authRouter from "./routes/auth.js"
import notificationsRouter from "./routes/notifications.js"
import aiRouter from "./routes/ai.js"

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors())
app.use(express.json())

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/api/auth", authRouter)
app.use("/api/goals", goalsRouter)
app.use("/api/contracts", contractsRouter)
app.use("/api/pledges", pledgesRouter)
app.use("/api/profile", profileRouter)
app.use("/api/notifications", notificationsRouter)
app.use("/api/ai", aiRouter)

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" })
})

app.listen(PORT, () => {
  console.log(`Contract Spirit API running at http://localhost:${PORT}`)
})
