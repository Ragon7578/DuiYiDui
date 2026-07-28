import { createApp } from "./app.js"

const PORT = Number(process.env.PORT) || 4000

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("[warn] JWT_SECRET is not set — using insecure default. Set JWT_SECRET before public launch.")
}

const app = createApp()

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
