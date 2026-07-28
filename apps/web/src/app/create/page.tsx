"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { AuthGuard } from "@/components/layout/auth-guard"
import { VoiceInput } from "@/components/create/voice-input"
import {
  createGoal,
  createContract,
  fetchUsers,
  parseIntent,
  type ParsedGoal,
  type ParsedContract,
} from "@/lib/api-client"
import { track } from "@/lib/analytics"
import { ApiError } from "@/lib/api"
import type { AuthUser } from "@/lib/types"

type CreateMode = "goal" | "contract"

export default function CreatePage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p className="text-muted">加载中...</p>}>
        <CreateContent />
      </Suspense>
    </AuthGuard>
  )
}

function CreateContent() {
  const searchParams = useSearchParams()
  const onboarding = searchParams.get("onboarding") === "1"
  const [mode, setMode] = useState<CreateMode>("goal")
  const [draftText, setDraftText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState("")
  const [parsedGoals, setParsedGoals] = useState<ParsedGoal[]>([])
  const [parsedContracts, setParsedContracts] = useState<ParsedContract[]>([])
  const [applyKey, setApplyKey] = useState(0)
  const [seedGoal, setSeedGoal] = useState<ParsedGoal | null>(null)
  const [seedContract, setSeedContract] = useState<ParsedContract | null>(null)

  useEffect(() => {
    track("page_create", { onboarding })
  }, [onboarding])

  async function handleParse() {
    if (!draftText.trim()) {
      setParseError("请先语音或文字输入计划内容")
      return
    }
    setParseError("")
    setParsing(true)
    try {
      const result = await parseIntent(draftText.trim(), mode)
      if (result.mode === "contract") {
        setMode("contract")
        setParsedContracts(result.contracts)
        setParsedGoals([])
        if (result.contracts[0]) {
          setSeedContract(result.contracts[0])
          setSeedGoal(null)
          setApplyKey((k) => k + 1)
        }
      } else {
        setMode("goal")
        setParsedGoals(result.goals)
        setParsedContracts([])
        if (result.goals[0]) {
          setSeedGoal(result.goals[0])
          setSeedContract(null)
          setApplyKey((k) => k + 1)
        }
      }
      if (
        (result.mode === "goal" && result.goals.length === 0) ||
        (result.mode === "contract" && result.contracts.length === 0)
      ) {
        setParseError("未能识别出有效信息，请再说具体一点，例如目标和奖励")
      }
    } catch (err) {
      setParseError(err instanceof ApiError ? err.message : "识别失败，请重试")
    } finally {
      setParsing(false)
    }
  }

  function applyGoal(goal: ParsedGoal) {
    setMode("goal")
    setSeedGoal(goal)
    setSeedContract(null)
    setApplyKey((k) => k + 1)
  }

  function applyContract(contract: ParsedContract) {
    setMode("contract")
    setSeedContract(contract)
    setSeedGoal(null)
    setApplyKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-seal">
          {onboarding ? "First" : "New"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight">
          {onboarding ? "写下第一个目标" : "创建"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {onboarding
            ? "一件事一屏：写清「要做到什么」和「做到了奖励自己什么」。"
            : "先写清「要做到什么」和「做到了奖励自己什么」。语音识别可选，填表同样完整。"}
        </p>
      </div>

      {onboarding && (
        <div className="rounded border border-seal/25 bg-seal-soft/50 px-4 py-3 text-sm text-ink">
          <p className="font-semibold">欢迎加入兑一兑</p>
          <p className="mt-1 text-muted">
            先创建一个带奖励的目标。可选写下 1 位见证人——找一个在乎你说到做到的人。
          </p>
        </div>
      )}

      {!onboarding && (
        <Card className="space-y-4 border-ink/10 bg-white/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">智能录入（可选）</h2>
              <p className="mt-1 text-xs text-muted">
                说：「如果我连续跑步30天，就奖励自己一双跑鞋，截止日期8月15日」
              </p>
            </div>
          </div>

          <VoiceInput value={draftText} onChange={setDraftText} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !draftText.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {parsing ? "识别中..." : "识别并填入表单"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftText("")
                setParsedGoals([])
                setParsedContracts([])
                setParseError("")
              }}
              className="rounded border border-line bg-white/80 px-4 py-2 text-sm font-semibold hover:border-ink"
            >
              清空
            </button>
          </div>

          {parseError && (
            <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">
              {parseError}
            </p>
          )}

          {parsedGoals.length > 1 && (
            <div className="space-y-2 border-t border-line pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                识别到多个目标 · 点击填入
              </p>
              {parsedGoals.map((g, i) => (
                <button
                  key={`${g.title}-${i}`}
                  type="button"
                  onClick={() => applyGoal(g)}
                  className="panel-interactive flex w-full items-start justify-between gap-3 rounded border border-line bg-white/80 px-3 py-2 text-left"
                >
                  <div>
                    <p className="font-semibold text-ink">{g.title}</p>
                    <p className="text-xs text-seal">奖励 · {g.reward}</p>
                  </div>
                  <span className="text-xs text-muted">填入</span>
                </button>
              ))}
            </div>
          )}

          {parsedContracts.length > 1 && (
            <div className="space-y-2 border-t border-line pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                识别到多份契约 · 点击填入
              </p>
              {parsedContracts.map((c, i) => (
                <button
                  key={`${c.title}-${i}`}
                  type="button"
                  onClick={() => applyContract(c)}
                  className="panel-interactive flex w-full items-start justify-between gap-3 rounded border border-line bg-white/80 px-3 py-2 text-left"
                >
                  <div>
                    <p className="font-semibold text-ink">{c.title}</p>
                    <p className="text-xs text-muted">{c.parties.join("、")}</p>
                  </div>
                  <span className="text-xs text-muted">填入</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {!onboarding && (
        <div className="flex gap-2 border-b border-line pb-3">
          <button
            onClick={() => setMode("goal")}
            className={`relative px-4 py-2 text-sm font-semibold transition ${
              mode === "goal" ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            创建目标
            {mode === "goal" && <span className="absolute inset-x-2 -bottom-3 h-0.5 bg-seal" />}
          </button>
          <button
            onClick={() => setMode("contract")}
            className={`relative px-4 py-2 text-sm font-semibold transition ${
              mode === "contract" ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            创建契约
            {mode === "contract" && <span className="absolute inset-x-2 -bottom-3 h-0.5 bg-seal" />}
          </button>
        </div>
      )}

      {mode === "goal" || onboarding ? (
        <GoalForm key={`goal-${applyKey}`} seed={seedGoal} onboarding={onboarding} />
      ) : (
        <ContractForm key={`contract-${applyKey}`} seed={seedContract} />
      )}
    </div>
  )
}

function GoalForm({
  seed,
  onboarding,
}: {
  seed?: ParsedGoal | null
  onboarding?: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState(seed?.title || "")
  const [description, setDescription] = useState(seed?.description || "")
  const [reward, setReward] = useState(seed?.reward || "")
  const [deadline, setDeadline] = useState(seed?.deadline || "")
  const [witnessUserId, setWitnessUserId] = useState("")
  const [witnessName, setWitnessName] = useState("")
  const [users, setUsers] = useState<AuthUser[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const nameOnly = !witnessUserId && witnessName.trim() ? witnessName.trim() : undefined
      await createGoal({
        title,
        description: description || undefined,
        reward,
        deadline: deadline || undefined,
        witnessUserId: witnessUserId || undefined,
        witnessName: nameOnly,
      })
      track("create_goal", {
        hasWitness: Boolean(witnessUserId || nameOnly),
        onboarding: Boolean(onboarding),
      })
      if (witnessUserId || nameOnly) track("invite_witness")
      router.push(onboarding ? "/" : "/goals")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "创建失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        {seed && (
          <p className="rounded border border-ok/20 bg-ok-soft px-3 py-2 text-xs text-ok">
            已根据语音/文字识别填入，可继续修改后提交
          </p>
        )}
        {error && (
          <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
        )}
        <div>
          <FormLabel required>目标标题</FormLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：连续跑步 30 天"
            className="input-field"
            required
          />
        </div>
        <div>
          <FormLabel required>做到了，你打算奖励自己什么？</FormLabel>
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="例如：一双跑鞋 / 一顿大餐"
            className="input-field"
            required
          />
          <p className="mt-1 text-xs text-muted">奖励写清楚，达成后才兑得了——这是产品核心，不是备注。</p>
        </div>
        {!onboarding && (
          <div>
            <FormLabel>描述</FormLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="具体要做些什么？（选填）"
              rows={3}
              className="input-field"
            />
          </div>
        )}
        <div>
          <FormLabel>截止日期</FormLabel>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-3">
          <FormLabel>见证人（建议 1 人，可不选）</FormLabel>
          <input
            value={witnessName}
            onChange={(e) => {
              setWitnessName(e.target.value)
              if (e.target.value) setWitnessUserId("")
            }}
            placeholder="写下名字，例如：小陈（对方尚未注册也可）"
            className="input-field"
            disabled={Boolean(witnessUserId)}
          />
          {users.length > 0 && (
            <select
              value={witnessUserId}
              onChange={(e) => {
                setWitnessUserId(e.target.value)
                if (e.target.value) setWitnessName("")
              }}
              className="input-field"
            >
              <option value="">或选择已注册用户</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <p className="text-xs text-muted">
            找一个在乎你说到做到的人。已注册用户确认后，你达成时对方也会涨成就点；仅写名字可先记下，稍后邀请对方注册确认。
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {loading ? "创建中..." : onboarding ? "创建我的第一个目标" : "创建目标"}
        </button>
      </form>
    </Card>
  )
}

function ContractForm({ seed }: { seed?: ParsedContract | null }) {
  const router = useRouter()
  const [title, setTitle] = useState(seed?.title || "")
  const [description, setDescription] = useState(seed?.description || "")
  const [reward, setReward] = useState(seed?.reward || "")
  const [clauseContent, setClauseContent] = useState("")
  const [clauses, setClauses] = useState<string[]>(seed?.clauses || [])
  const [partyName, setPartyName] = useState("")
  const [parties, setParties] = useState<{ name: string; role: string }[]>(
    (seed?.parties || []).map((name) => ({ name, role: "promisee" }))
  )
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function addParty() {
    if (partyName.trim()) {
      setParties([...parties, { name: partyName.trim(), role: "promisee" }])
      setPartyName("")
    }
  }

  function addClause() {
    if (clauseContent.trim()) {
      setClauses([...clauses, clauseContent.trim()])
      setClauseContent("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (parties.length === 0) {
      setError("请至少添加一个参与方")
      return
    }
    if (clauses.length === 0) {
      setError("请至少添加一条条款")
      return
    }
    setError("")
    setLoading(true)
    try {
      await createContract({
        title,
        description: description || undefined,
        reward: reward || undefined,
        parties,
        clauses: clauses.map((c) => ({ content: c })),
      })
      router.push("/contracts")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "创建失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        {seed && (
          <p className="rounded border border-ok/20 bg-ok-soft px-3 py-2 text-xs text-ok">
            已根据语音/文字识别填入，可继续修改后提交
          </p>
        )}
        {error && (
          <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
        )}
        <div>
          <FormLabel required>契约标题</FormLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：合作约定"
            className="input-field"
            required
          />
        </div>
        <div>
          <FormLabel>描述</FormLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field"
          />
        </div>
        <div>
          <FormLabel>约定奖励</FormLabel>
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <FormLabel required>参与方</FormLabel>
          <div className="flex gap-2">
            <input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="输入对方名称"
              className="input-field flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addParty())}
            />
            <button type="button" onClick={addParty} className="rounded border border-line px-4 py-2 text-sm hover:border-ink">
              添加
            </button>
          </div>
          {parties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {parties.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded bg-paper-deep px-3 py-1 text-sm">
                  {p.name}
                  <button type="button" onClick={() => setParties(parties.filter((_, j) => j !== i))} className="text-muted hover:text-ink">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <FormLabel required>条款</FormLabel>
          <div className="flex gap-2">
            <input
              value={clauseContent}
              onChange={(e) => setClauseContent(e.target.value)}
              placeholder="输入条款内容"
              className="input-field flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addClause())}
            />
            <button type="button" onClick={addClause} className="rounded border border-line px-4 py-2 text-sm hover:border-ink">
              添加
            </button>
          </div>
          {clauses.length > 0 && (
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted">
              {clauses.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {loading ? "创建中..." : "创建契约"}
        </button>
      </form>
    </Card>
  )
}
