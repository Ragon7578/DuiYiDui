import { Router } from "express"
import { getDb } from "../db/schema.js"
import { v4 as uuid } from "uuid"
import type { Contract, Clause, Party } from "../types"

const router = Router()

router.get("/", (req, res) => {
  const db = getDb()
  const rows = db.prepare("SELECT * FROM contracts ORDER BY created_at DESC").all() as any[]
  const contracts = rows.map(row => enrichContract(row))
  res.json(contracts)
})

router.get("/:id", (req, res) => {
  const db = getDb()
  const row = db.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id) as any
  if (!row) { res.status(404).json({ error: "Contract not found" }); return }
  res.json(enrichContract(row))
})

router.post("/", (req, res) => {
  const db = getDb()
  const { title, description, parties, clauses, reward } = req.body
  if (!title) { res.status(400).json({ error: "title is required" }); return }
  if (!parties || parties.length === 0) { res.status(400).json({ error: "at least one party is required" }); return }
  if (!clauses || clauses.length === 0) { res.status(400).json({ error: "at least one clause is required" }); return }

  const contractId = uuid()
  const now = new Date().toISOString().split("T")[0]

  db.prepare(`
    INSERT INTO contracts (id, title, description, status, reward, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?)
  `).run(contractId, title, description || "", reward || null, now, now)

  const insertParty = db.prepare("INSERT INTO parties (id, contract_id, name, role, signed_at) VALUES (?, ?, ?, ?, ?)")
  for (const p of parties) {
    insertParty.run(p.id, contractId, p.name, p.role, now)
  }

  const insertClause = db.prepare("INSERT INTO clauses (id, contract_id, content, status, due_date) VALUES (?, ?, ?, 'pending', ?)")
  for (const c of clauses) {
    insertClause.run(uuid(), contractId, c.content, c.dueDate || null)
  }

  const userParties = new Set(parties.filter((p: any) => p.id.startsWith("u")).map((p: any) => p.id))
  for (const uid of userParties) {
    db.prepare("UPDATE users SET total_contracts = total_contracts + 1 WHERE id = ?").run(uid)
  }

  const row = db.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId) as any
  res.status(201).json(enrichContract(row))
})

router.patch("/:id", (req, res) => {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id) as any
  if (!existing) { res.status(404).json({ error: "Contract not found" }); return }

  const { title, description, status, reward } = req.body
  const sets: string[] = []
  const params: any[] = []

  if (title !== undefined) { sets.push("title = ?"); params.push(title) }
  if (description !== undefined) { sets.push("description = ?"); params.push(description) }
  if (status !== undefined) { sets.push("status = ?"); params.push(status) }
  if (reward !== undefined) { sets.push("reward = ?"); params.push(reward) }
  sets.push("updated_at = datetime('now')")

  if (status === "completed") {
    sets.push("signed_at = COALESCE(signed_at, datetime('now'))")
  }

  params.push(req.params.id)
  db.prepare(`UPDATE contracts SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  if (status === "completed" && existing.status !== "completed") {
    const parties = db.prepare("SELECT * FROM parties WHERE contract_id = ?").all(req.params.id) as any[]
    const userIds = new Set(parties.filter((p: any) => p.id.startsWith("u")).map((p: any) => p.id))
    for (const uid of userIds) {
      db.prepare("UPDATE users SET fulfilled_contracts = fulfilled_contracts + 1, trust_score = MIN(100, trust_score + 10) WHERE id = ?").run(uid)
    }
  }

  if (status === "breached" && existing.status !== "breached") {
    const parties = db.prepare("SELECT * FROM parties WHERE contract_id = ?").all(req.params.id) as any[]
    const userIds = new Set(parties.filter((p: any) => p.id.startsWith("u")).map((p: any) => p.id))
    for (const uid of userIds) {
      db.prepare("UPDATE users SET breached_contracts = breached_contracts + 1, trust_score = MAX(0, trust_score - 15) WHERE id = ?").run(uid)
    }
  }

  const row = db.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id) as any
  res.json(enrichContract(row))
})

router.patch("/:id/clauses/:clauseId", (req, res) => {
  const db = getDb()
  const clause = db.prepare("SELECT * FROM clauses WHERE id = ? AND contract_id = ?").get(req.params.clauseId, req.params.id) as any
  if (!clause) { res.status(404).json({ error: "Clause not found" }); return }

  const { status } = req.body
  if (!status) { res.status(400).json({ error: "status is required" }); return }

  db.prepare("UPDATE clauses SET status = ? WHERE id = ?").run(status, req.params.clauseId)
  db.prepare("UPDATE contracts SET updated_at = datetime('now') WHERE id = ?").run(req.params.id)

  const allClauses = db.prepare("SELECT * FROM clauses WHERE contract_id = ?").all(req.params.id) as any[]
  const allDone = allClauses.every((c: any) => c.status === "fulfilled")
  const anyBreached = allClauses.some((c: any) => c.status === "breached")

  if (allDone) {
    db.prepare("UPDATE contracts SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(req.params.id)
    const parties = db.prepare("SELECT * FROM parties WHERE contract_id = ?").all(req.params.id) as any[]
    const userIds = new Set(parties.filter((p: any) => p.id.startsWith("u")).map((p: any) => p.id))
    for (const uid of userIds) {
      db.prepare("UPDATE users SET fulfilled_contracts = fulfilled_contracts + 1, trust_score = MIN(100, trust_score + 10) WHERE id = ?").run(uid)
    }
  } else if (anyBreached) {
    db.prepare("UPDATE contracts SET status = 'breached', updated_at = datetime('now') WHERE id = ?").run(req.params.id)
    const parties = db.prepare("SELECT * FROM parties WHERE contract_id = ?").all(req.params.id) as any[]
    const userIds = new Set(parties.filter((p: any) => p.id.startsWith("u")).map((p: any) => p.id))
    for (const uid of userIds) {
      db.prepare("UPDATE users SET breached_contracts = breached_contracts + 1, trust_score = MAX(0, trust_score - 15) WHERE id = ?").run(uid)
    }
  }

  const updated = db.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id) as any
  res.json(enrichContract(updated))
})

router.delete("/:id", (req, res) => {
  const db = getDb()
  const existing = db.prepare("SELECT * FROM contracts WHERE id = ?").get(req.params.id) as any
  if (!existing) { res.status(404).json({ error: "Contract not found" }); return }
  db.prepare("DELETE FROM contracts WHERE id = ?").run(req.params.id)
  res.status(204).send()
})

function enrichContract(row: any): Contract {
  const db = getDb()
  const parties = db.prepare("SELECT * FROM parties WHERE contract_id = ?").all(row.id) as any[]
  const clauses = db.prepare("SELECT * FROM clauses WHERE contract_id = ?").all(row.id) as any[]

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    reward: row.reward,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    signedAt: row.signed_at,
    parties: parties.map((p: any): Party => ({
      id: p.id,
      name: p.name,
      role: p.role,
      signedAt: p.signed_at,
    })),
    clauses: clauses.map((c: any): Clause => ({
      id: c.id,
      content: c.content,
      status: c.status,
      dueDate: c.due_date,
    })),
  }
}

export default router
