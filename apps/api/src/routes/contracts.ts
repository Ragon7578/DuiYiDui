import { Router } from "express"
import { getDb } from "../db/schema.js"
import { adjustTrustScore } from "../db/trust.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { param } from "../utils/params.js"
import type { Contract, Clause, Party } from "../types.js"

const router = Router()

function partyUserIds(contractId: string): string[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT DISTINCT COALESCE(user_id, id) AS uid
    FROM parties
    WHERE contract_id = ?
  `).all(contractId) as { uid: string }[]
  const ids: string[] = []
  for (const r of rows) {
    const exists = db.prepare("SELECT id FROM users WHERE id = ?").get(r.uid)
    if (exists) ids.push(r.uid)
  }
  return ids
}

router.get("/", requireAuth, (req, res) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT DISTINCT c.* FROM contracts c
    LEFT JOIN parties p ON p.contract_id = c.id
    WHERE p.id = ? OR p.user_id = ? OR c.owner_user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user!.userId, req.user!.userId, req.user!.userId) as any[]
  res.json(rows.map((row) => enrichContract(row)))
})

router.get("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const row = db.prepare(`
    SELECT DISTINCT c.* FROM contracts c
    LEFT JOIN parties p ON p.contract_id = c.id
    WHERE c.id = ? AND (p.id = ? OR p.user_id = ? OR c.owner_user_id = ?)
  `).get(param(req.params.id), req.user!.userId, req.user!.userId, req.user!.userId) as any
  if (!row) { res.status(404).json({ error: "Contract not found" }); return }
  res.json(enrichContract(row))
})

router.post("/", requireAuth, (req, res) => {
  const db = getDb()
  const { title, description, parties, clauses, reward } = req.body
  if (!title) { res.status(400).json({ error: "title is required" }); return }
  if (!parties || parties.length === 0) { res.status(400).json({ error: "at least one party is required" }); return }
  if (!clauses || clauses.length === 0) { res.status(400).json({ error: "at least one clause is required" }); return }

  const contractId = uuid()
  const now = new Date().toISOString().split("T")[0]
  const ownerId = req.user!.userId

  db.prepare(`
    INSERT INTO contracts (id, title, description, status, reward, owner_user_id, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
  `).run(contractId, title, description || "", reward || null, ownerId, now, now)

  const insertParty = db.prepare(
    "INSERT INTO parties (id, contract_id, name, role, user_id, signed_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
  const currentUser = db.prepare("SELECT name FROM users WHERE id = ?").get(ownerId) as { name: string }
  insertParty.run(ownerId, contractId, currentUser.name, "promisor", ownerId, now)

  for (const p of parties) {
    const partyId = p.id || uuid()
    const linkedUser = p.id
      ? (db.prepare("SELECT id FROM users WHERE id = ?").get(p.id) as { id: string } | undefined)
      : undefined
    insertParty.run(partyId, contractId, p.name, p.role, linkedUser?.id ?? null, now)
  }

  const insertClause = db.prepare(
    "INSERT INTO clauses (id, contract_id, content, status, due_date) VALUES (?, ?, ?, 'pending', ?)"
  )
  for (const c of clauses) {
    insertClause.run(uuid(), contractId, c.content, c.dueDate || null)
  }

  db.prepare(
    "UPDATE users SET total_contracts = total_contracts + 1, updated_at = datetime('now') WHERE id = ?"
  ).run(ownerId)
  for (const uid of partyUserIds(contractId)) {
    if (uid !== ownerId) {
      db.prepare(
        "UPDATE users SET total_contracts = total_contracts + 1, updated_at = datetime('now') WHERE id = ?"
      ).run(uid)
    }
  }

  const row = db.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId) as any
  res.status(201).json(enrichContract(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT DISTINCT c.* FROM contracts c
    LEFT JOIN parties p ON p.contract_id = c.id
    WHERE c.id = ? AND (p.id = ? OR p.user_id = ? OR c.owner_user_id = ?)
  `).get(param(req.params.id), req.user!.userId, req.user!.userId, req.user!.userId) as any
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

  params.push(param(req.params.id))
  db.prepare(`UPDATE contracts SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  if (status === "completed" && existing.status !== "completed") {
    for (const uid of partyUserIds(param(req.params.id))) {
      db.prepare(
        "UPDATE users SET fulfilled_contracts = fulfilled_contracts + 1, updated_at = datetime('now') WHERE id = ?"
      ).run(uid)
      adjustTrustScore(uid, 10, "contract_fulfilled", {
        type: "contract",
        id: param(req.params.id),
      })
    }
  }

  if (status === "breached" && existing.status !== "breached") {
    for (const uid of partyUserIds(param(req.params.id))) {
      db.prepare(
        "UPDATE users SET breached_contracts = breached_contracts + 1, updated_at = datetime('now') WHERE id = ?"
      ).run(uid)
      adjustTrustScore(uid, -15, "contract_breached", {
        type: "contract",
        id: param(req.params.id),
      })
    }
  }

  const row = db.prepare("SELECT * FROM contracts WHERE id = ?").get(param(req.params.id)) as any
  res.json(enrichContract(row))
})

router.patch("/:id/clauses/:clauseId", requireAuth, (req, res) => {
  const db = getDb()
  const access = db.prepare(`
    SELECT c.id FROM contracts c
    LEFT JOIN parties p ON p.contract_id = c.id
    WHERE c.id = ? AND (p.id = ? OR p.user_id = ? OR c.owner_user_id = ?)
  `).get(param(req.params.id), req.user!.userId, req.user!.userId, req.user!.userId)
  if (!access) { res.status(404).json({ error: "Contract not found" }); return }

  const clause = db.prepare("SELECT * FROM clauses WHERE id = ? AND contract_id = ?").get(
    param(req.params.clauseId),
    param(req.params.id)
  ) as any
  if (!clause) { res.status(404).json({ error: "Clause not found" }); return }

  const { status } = req.body
  if (!status) { res.status(400).json({ error: "status is required" }); return }

  db.prepare(
    "UPDATE clauses SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, param(req.params.clauseId))
  db.prepare("UPDATE contracts SET updated_at = datetime('now') WHERE id = ?").run(param(req.params.id))

  const allClauses = db.prepare("SELECT * FROM clauses WHERE contract_id = ?").all(param(req.params.id)) as any[]
  const allDone = allClauses.every((c: any) => c.status === "fulfilled")
  const anyBreached = allClauses.some((c: any) => c.status === "breached")
  const contractId = param(req.params.id)
  const existing = db.prepare("SELECT status FROM contracts WHERE id = ?").get(contractId) as {
    status: string
  }

  if (allDone && existing.status !== "completed") {
    db.prepare(
      "UPDATE contracts SET status = 'completed', updated_at = datetime('now') WHERE id = ?"
    ).run(contractId)
    for (const uid of partyUserIds(contractId)) {
      db.prepare(
        "UPDATE users SET fulfilled_contracts = fulfilled_contracts + 1, updated_at = datetime('now') WHERE id = ?"
      ).run(uid)
      adjustTrustScore(uid, 10, "contract_fulfilled", { type: "contract", id: contractId })
    }
  } else if (anyBreached && existing.status !== "breached") {
    db.prepare(
      "UPDATE contracts SET status = 'breached', updated_at = datetime('now') WHERE id = ?"
    ).run(contractId)
    for (const uid of partyUserIds(contractId)) {
      db.prepare(
        "UPDATE users SET breached_contracts = breached_contracts + 1, updated_at = datetime('now') WHERE id = ?"
      ).run(uid)
      adjustTrustScore(uid, -15, "contract_breached", { type: "contract", id: contractId })
    }
  }

  const updated = db.prepare("SELECT * FROM contracts WHERE id = ?").get(param(req.params.id)) as any
  res.json(enrichContract(updated))
})

router.delete("/:id", requireAuth, (req, res) => {
  const db = getDb()
  const existing = db.prepare(`
    SELECT DISTINCT c.* FROM contracts c
    LEFT JOIN parties p ON p.contract_id = c.id
    WHERE c.id = ? AND (p.id = ? OR p.user_id = ? OR c.owner_user_id = ?)
  `).get(param(req.params.id), req.user!.userId, req.user!.userId, req.user!.userId) as any
  if (!existing) { res.status(404).json({ error: "Contract not found" }); return }
  db.prepare("DELETE FROM contracts WHERE id = ?").run(param(req.params.id))
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
