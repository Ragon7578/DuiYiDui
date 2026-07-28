import { Router } from "express"
import { getDb } from "../db/schema.js"
import { type AgreementRow } from "../db/mappers.js"
import { v4 as uuid } from "uuid"
import { requireAuth } from "../middleware/auth.js"
import { requireSuperviseUnlocked } from "../middleware/require-supervise-unlocked.js"
import { param } from "../utils/params.js"
import {
  AGREEMENT_FOR_MEMBER,
  bumpPartyTrust,
  enrichAgreement,
  LIST_AGREEMENTS_FOR_USER,
  resolveOtherParties,
  syncAgreementStatusFromClauses,
} from "../services/supervise-agreements.js"
import { getUserById } from "../services/users.js"

const router = Router()

router.get("/", requireAuth, (req, res) => {
  const rows = getDb()
    .prepare(LIST_AGREEMENTS_FOR_USER)
    .all(req.user!.userId) as unknown as AgreementRow[]
  res.json(rows.map(enrichAgreement))
})

router.get("/:id", requireAuth, (req, res) => {
  const row = getDb()
    .prepare(AGREEMENT_FOR_MEMBER)
    .get(param(req.params.id), req.user!.userId) as AgreementRow | undefined
  if (!row) {
    res.status(404).json({ error: "Contract not found" })
    return
  }
  res.json(enrichAgreement(row))
})

router.post("/", requireAuth, requireSuperviseUnlocked, (req, res) => {
  const { title, description, parties, clauses, reward } = req.body
  if (!title) {
    res.status(400).json({ error: "title is required" })
    return
  }
  if (!parties?.length) {
    res.status(400).json({ error: "at least one other party (real user) is required" })
    return
  }
  if (!clauses?.length) {
    res.status(400).json({ error: "at least one clause is required" })
    return
  }

  const resolved = resolveOtherParties(parties, req.user!.userId)
  if ("error" in resolved) {
    res.status(400).json({ error: resolved.error })
    return
  }

  const db = getDb()
  const agreementId = uuid()
  const now = new Date().toISOString().split("T")[0]
  const currentUser = getUserById(req.user!.userId)!

  db.prepare(
    `INSERT INTO supervise_agreements (
       id, created_by_user_id, title, description, status, reward, created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`
  ).run(agreementId, req.user!.userId, title, description || "", reward || null, now, now)

  const insertParty = db.prepare(
    `INSERT INTO supervise_parties (agreement_id, user_id, display_name, role, signed_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  insertParty.run(agreementId, currentUser.userId, currentUser.name, "promisor", now)
  for (const p of resolved) {
    insertParty.run(agreementId, p.userId, p.name, "promisee", now)
  }

  const insertClause = db.prepare(
    `INSERT INTO supervise_clauses (id, agreement_id, content, status, due_date)
     VALUES (?, ?, ?, 'pending', ?)`
  )
  for (const c of clauses) {
    insertClause.run(uuid(), agreementId, c.content, c.dueDate || null)
  }

  const bumpTotal = db.prepare("UPDATE users SET total_contracts = total_contracts + 1 WHERE id = ?")
  bumpTotal.run(req.user!.userId)
  for (const p of resolved) bumpTotal.run(p.userId)

  const row = db.prepare("SELECT * FROM supervise_agreements WHERE id = ?").get(agreementId) as unknown as AgreementRow
  res.status(201).json(enrichAgreement(row))
})

router.patch("/:id", requireAuth, (req, res) => {
  const existing = getDb()
    .prepare(AGREEMENT_FOR_MEMBER)
    .get(param(req.params.id), req.user!.userId) as AgreementRow | undefined
  if (!existing) {
    res.status(404).json({ error: "Contract not found" })
    return
  }

  const { title, description, status, reward } = req.body
  const sets: string[] = []
  const params: (string | number | null)[] = []

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
  getDb().prepare(`UPDATE supervise_agreements SET ${sets.join(", ")} WHERE id = ?`).run(...params)

  if (status === "completed" && existing.status !== "completed") {
    bumpPartyTrust(param(req.params.id), "fulfilled")
  }
  if (status === "breached" && existing.status !== "breached") {
    bumpPartyTrust(param(req.params.id), "breached")
  }

  const row = getDb()
    .prepare("SELECT * FROM supervise_agreements WHERE id = ?")
    .get(param(req.params.id)) as unknown as AgreementRow
  res.json(enrichAgreement(row))
})

router.patch("/:id/clauses/:clauseId", requireAuth, (req, res) => {
  const access = getDb().prepare(AGREEMENT_FOR_MEMBER).get(param(req.params.id), req.user!.userId)
  if (!access) {
    res.status(404).json({ error: "Contract not found" })
    return
  }

  const db = getDb()
  const clause = db
    .prepare("SELECT * FROM supervise_clauses WHERE id = ? AND agreement_id = ?")
    .get(param(req.params.clauseId), param(req.params.id))
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

  syncAgreementStatusFromClauses(param(req.params.id))

  const row = db
    .prepare("SELECT * FROM supervise_agreements WHERE id = ?")
    .get(param(req.params.id)) as unknown as AgreementRow
  res.json(enrichAgreement(row))
})

router.delete("/:id", requireAuth, (req, res) => {
  const existing = getDb()
    .prepare(AGREEMENT_FOR_MEMBER)
    .get(param(req.params.id), req.user!.userId)
  if (!existing) {
    res.status(404).json({ error: "Contract not found" })
    return
  }
  getDb().prepare("DELETE FROM supervise_agreements WHERE id = ?").run(param(req.params.id))
  res.status(204).send()
})

export default router
