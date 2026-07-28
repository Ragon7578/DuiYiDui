import { Router } from "express"
import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import type { Contract, Clause, Party } from "../types.js"

const router = Router()

/** Supervise 域：多方监督约定（API 路径仍为 /api/contracts） */

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  const rows = db
    .prepare(
      `
    SELECT DISTINCT a.* FROM supervise_agreements a
    JOIN supervise_parties p ON p.agreement_id = a.id
    WHERE p.user_id = ?
    ORDER BY a.created_at DESC
  `
    )
    .all(req.user!.userId) as any[]
  res.json(rows.map((row) => enrichContract(row)))
})

router.get("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const row = db
    .prepare(
      `
    SELECT a.* FROM supervise_agreements a
    JOIN supervise_parties p ON p.agreement_id = a.id
    WHERE a.id = ? AND p.user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!row) {
    res.status(404).json({ error: "Contract not found" })
    return
  }
  res.json(enrichContract(row))
})

router.post("/", requireAuth, (req, res) => {
  const db = getDb()
  const { title, description, parties, clauses, reward } = req.body
  if (!title) {
    res.status(400).json({ error: "title is required" })
    return
  }
  if (!parties || parties.length === 0) {
    res.status(400).json({ error: "at least one other party (real user) is required" })
    return
  }
  if (!clauses || clauses.length === 0) {
    res.status(400).json({ error: "at least one clause is required" })
    return
  }

  const resolved: { userId: string; name: string; role: string }[] = []
  for (const p of parties) {
    const user = resolvePartyUser(p)
    if (!user) {
      res.status(400).json({
        error: `party must be a real user (id or registered name): ${p.name || p.id || "?"}`,
      })
      return
    }
    if (user.userId === req.user!.userId) continue
    if (resolved.some((r) => r.userId === user.userId)) continue
    resolved.push({ userId: user.userId, name: user.name, role: p.role || "promisee" })
  }

  if (resolved.length === 0) {
    res.status(400).json({ error: "at least one other real user is required" })
    return
  }

  const agreementId = uuid()
  const now = new Date().toISOString().split("T")[0]
  const currentUser = db.prepare("SELECT name FROM users WHERE id = ?").get(req.user!.userId) as {
    name: string
  }

  db.prepare(
    `
    INSERT INTO supervise_agreements (
      id, created_by_user_id, title, description, status, reward, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
  `
  ).run(
    agreementId,
    req.user!.userId,
    title,
    description || "",
    reward || null,
    now,
    now
  )

  const insertParty = db.prepare(
    `
    INSERT INTO supervise_parties (agreement_id, user_id, display_name, role, signed_at)
    VALUES (?, ?, ?, ?, ?)
  `
  )
  insertParty.run(agreementId, req.user!.userId, currentUser.name, "promisor", now)

  for (const p of resolved) {
    insertParty.run(agreementId, p.userId, p.name, p.role, now)
  }

  const insertClause = db.prepare(
    `
    INSERT INTO supervise_clauses (id, agreement_id, content, status, due_date)
    VALUES (?, ?, ?, 'pending', ?)
  `
  )
  for (const c of clauses) {
    insertClause.run(uuid(), agreementId, c.content, c.dueDate || null)
  }

  db.prepare("UPDATE users SET total_contracts = total_contracts + 1 WHERE id = ?").run(
    req.user!.userId
  )
  for (const p of resolved) {
    db.prepare("UPDATE users SET total_contracts = total_contracts + 1 WHERE id = ?").run(p.userId)
  }

  const row = db.prepare("SELECT * FROM supervise_agreements WHERE id = ?").get(agreementId) as any
  res.status(201).json(enrichContract(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db
    .prepare(
      `
    SELECT a.* FROM supervise_agreements a
    JOIN supervise_parties p ON p.agreement_id = a.id
    WHERE a.id = ? AND p.user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!existing) {
    res.status(404).json({ error: "Contract not found" })
    return
  }

  const { title, description, status, reward } = req.body
  const sets: string[] = []
  const params: any[] = []

  if (title !== undefined) {
    sets.push("title = ?")
    params.push(title)
  }
  if (description !== undefined) {
    sets.push("description = ?")
    params.push(description)
  }
  if (status !== undefined) {
    sets.push("status = ?")
    params.push(status)
  }
  if (reward !== undefined) {
    sets.push("reward = ?")
    params.push(reward)
  }
  sets.push("updated_at = datetime('now')")

  if (status === "completed") {
    sets.push("signed_at = COALESCE(signed_at, datetime('now'))")
  }

  params.push(param(req.params.id))
  db.prepare(`UPDATE supervise_agreements SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  if (status === "completed" && existing.status !== "completed") {
    bumpPartyStats(param(req.params.id), "fulfilled")
  }

  if (status === "breached" && existing.status !== "breached") {
    bumpPartyStats(param(req.params.id), "breached")
  }

  const row = db
    .prepare("SELECT * FROM supervise_agreements WHERE id = ?")
    .get(param(req.params.id)) as any
  res.json(enrichContract(row))
})

router.patch("/:id/clauses/:clauseId", requireAuth, (req, res) => {
  const db = getDb()
  const access = db
    .prepare(
      `
    SELECT a.id FROM supervise_agreements a
    JOIN supervise_parties p ON p.agreement_id = a.id
    WHERE a.id = ? AND p.user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId)
  if (!access) {
    res.status(404).json({ error: "Contract not found" })
    return
  }

  const clause = db
    .prepare("SELECT * FROM supervise_clauses WHERE id = ? AND agreement_id = ?")
    .get(param(req.params.clauseId), param(req.params.id)) as any
  if (!clause) {
    res.status(404).json({ error: "Clause not found" })
    return
  }

  const { status } = req.body
  if (!status) {
    res.status(400).json({ error: "status is required" })
    return
  }

  db.prepare("UPDATE supervise_clauses SET status = ? WHERE id = ?").run(
    status,
    param(req.params.clauseId)
  )
  db.prepare("UPDATE supervise_agreements SET updated_at = datetime('now') WHERE id = ?").run(
    param(req.params.id)
  )

  const allClauses = db
    .prepare("SELECT * FROM supervise_clauses WHERE agreement_id = ?")
    .all(param(req.params.id)) as any[]
  const allDone = allClauses.every((c: any) => c.status === "fulfilled")
  const anyBreached = allClauses.some((c: any) => c.status === "breached")

  if (allDone) {
    db.prepare(
      `
      UPDATE supervise_agreements SET status = 'completed', updated_at = datetime('now') WHERE id = ?
    `
    ).run(param(req.params.id))
    bumpPartyStats(param(req.params.id), "fulfilled")
  } else if (anyBreached) {
    db.prepare(
      `
      UPDATE supervise_agreements SET status = 'breached', updated_at = datetime('now') WHERE id = ?
    `
    ).run(param(req.params.id))
    bumpPartyStats(param(req.params.id), "breached")
  }

  const updated = db
    .prepare("SELECT * FROM supervise_agreements WHERE id = ?")
    .get(param(req.params.id)) as any
  res.json(enrichContract(updated))
})

router.delete("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db
    .prepare(
      `
    SELECT a.* FROM supervise_agreements a
    JOIN supervise_parties p ON p.agreement_id = a.id
    WHERE a.id = ? AND p.user_id = ?
  `
    )
    .get(param(req.params.id), req.user!.userId) as any
  if (!existing) {
    res.status(404).json({ error: "Contract not found" })
    return
  }
  db.prepare("DELETE FROM supervise_agreements WHERE id = ?").run(param(req.params.id))
  res.status(204).send()
})

function resolvePartyUser(p: { id?: string; name?: string }): { userId: string; name: string } | null {
  const db = getDb()
  if (p.id) {
    const byId = db.prepare("SELECT id, name FROM users WHERE id = ?").get(p.id) as
      | { id: string; name: string }
      | undefined
    if (byId) return { userId: byId.id, name: byId.name }
  }
  if (p.name?.trim()) {
    const byName = db.prepare("SELECT id, name FROM users WHERE name = ?").get(p.name.trim()) as
      | { id: string; name: string }
      | undefined
    if (byName) return { userId: byName.id, name: byName.name }
  }
  return null
}

function bumpPartyStats(agreementId: string, kind: "fulfilled" | "breached") {
  const db = getDb()
  const parties = db
    .prepare("SELECT user_id FROM supervise_parties WHERE agreement_id = ?")
    .all(agreementId) as { user_id: string }[]
  for (const { user_id } of parties) {
    if (kind === "fulfilled") {
      db.prepare(
        `
        UPDATE users SET fulfilled_contracts = fulfilled_contracts + 1,
          trust_score = MIN(100, trust_score + 10) WHERE id = ?
      `
      ).run(user_id)
    } else {
      db.prepare(
        `
        UPDATE users SET breached_contracts = breached_contracts + 1,
          trust_score = MAX(0, trust_score - 15) WHERE id = ?
      `
      ).run(user_id)
    }
  }
}

function enrichContract(row: any): Contract {
  const db = getDb()
  const parties = db
    .prepare("SELECT * FROM supervise_parties WHERE agreement_id = ?")
    .all(row.id) as any[]
  const clauses = db
    .prepare("SELECT * FROM supervise_clauses WHERE agreement_id = ?")
    .all(row.id) as any[]

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    reward: row.reward,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    signedAt: row.signed_at,
    parties: parties.map(
      (p: any): Party => ({
        id: p.user_id,
        name: p.display_name,
        role: p.role,
        signedAt: p.signed_at,
      })
    ),
    clauses: clauses.map(
      (c: any): Clause => ({
        id: c.id,
        content: c.content,
        status: c.status,
        dueDate: c.due_date,
      })
    ),
  }
}

export default router
