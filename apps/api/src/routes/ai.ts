import { Router } from "express"
import { requireAuth } from "../middleware/auth.js"
import { parseIntentWithAI } from "../services/intent-parser.js"

const router = Router()

router.post("/parse", requireAuth, async (req, res) => {
  const { text, mode } = req.body as { text?: string; mode?: "goal" | "contract" }

  if (!text || typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" })
    return
  }

  if (text.length > 2000) {
    res.status(400).json({ error: "text too long (max 2000)" })
    return
  }

  try {
    const result = await parseIntentWithAI(text.trim(), mode)
    res.json(result)
  } catch {
    res.status(500).json({ error: "Failed to parse intent" })
  }
})

export default router
