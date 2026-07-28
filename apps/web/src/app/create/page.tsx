"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { FormLabel } from "@/components/ui/form-label"
import { AuthGuard } from "@/components/layout/auth-guard"
import { VoiceInput } from "@/components/create/voice-input"
import {
  createGoal,
  createContract,
  parseIntent,
  type ParsedGoal,
  type ParsedContract,
} from "@/lib/api-client"
import { track } from "@/lib/analytics"
import { ApiError } from "@/lib/api"
import { useOtherUsers } from "@/lib/use-other-users"
import { UserSelect } from "@/components/users/user-select"
import { SuperviseUnlockGate } from "@/components/roles/supervise-unlock-gate"
import { useAuth } from "@/lib/auth-context"
import { ROLES, parseRoleSet, roleSetToCreateMode, superviseUnlockRemaining, type RoleSet } from "@/lib/roles"

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

function RolePicker({ onboarding }: { onboarding: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const othersLocked = user ? !user.superviseUnlocked : true

  function pickRole(set: RoleSet) {
    if (set === "others" && othersLocked) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("set", set)
    router.push(`/create?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-seal">New</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight">创建</h1>
        <p className="mt-2 text-sm text-muted">先选角色：这是给自己的项目，还是给别人的项目？</p>
      </div>

      {onboarding && (
        <div className="rounded border border-seal/25 bg-seal-soft/50 px-4 py-3 text-sm text-ink">
          <p className="font-semibold">欢迎加入兑一兑</p>
          <p className="mt-1 text-muted">
            建议先从「给自己的项目」开始：写一条带奖励的承诺。他人角色需先达成足够数量的自身计划后解锁。
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {([ROLES.self, ROLES.others] as const).map((role) => {
          const locked = role.set === "others" && othersLocked
          return (
            <button
              key={role.set}
              type="button"
              onClick={() => pickRole(role.set)}
              disabled={locked}
              className={`rounded border p-6 text-left transition ${
                locked
                  ? "cursor-not-allowed border-line/60 bg-paper/40 opacity-75"
                  : "panel-interactive border-line bg-white/90 hover:border-ink"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-seal">{role.navLabel}</p>
              <p className="mt-2 font-display text-xl font-bold text-ink">{role.projectLabel}</p>
              <p className="mt-2 text-sm text-muted">{role.description}</p>
              {locked && user ? (
                <span className="mt-4 inline-block text-sm font-semibold text-muted">
                  还需达成 {superviseUnlockRemaining(user)} 个 ·{" "}
                  <Link href={ROLES.others.route} className="text-seal hover:underline" onClick={(e) => e.stopPropagation()}>
                    去解锁
                  </Link>
                </span>
              ) : (
                <span className="mt-4 inline-block text-sm font-semibold text-seal">选择 →</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function CreateContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const onboarding = searchParams.get("onboarding") === "1"
  const setParam = searchParams.get("set")
  const roleSet = parseRoleSet(setParam)

  if (!roleSet) {
    return <RolePicker onboarding={onboarding} />
  }

  if (roleSet === "others" && user && !user.superviseUnlocked) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-rise">
        <Link
          href={`/create${onboarding ? "?onboarding=1" : ""}`}
          className="text-sm font-semibold text-seal hover:underline"
        >
          ← 重新选角色
        </Link>
        <SuperviseUnlockGate user={user} />
      </div>
    )
  }

  return <CreateForm roleSet={roleSet} onboarding={onboarding} setParam={setParam} />
}

function CreateForm({
  roleSet,
  onboarding,
  setParam,
}: {
  roleSet: RoleSet
  onboarding: boolean
  setParam: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = roleSetToCreateMode(roleSet)
  const [mode, setMode] = useState<CreateMode>(initialMode)
  const [draftText, setDraftText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState("")
  const [parsedGoals, setParsedGoals] = useState<ParsedGoal[]>([])
  const [parsedContracts, setParsedContracts] = useState<ParsedContract[]>([])
  const [applyKey, setApplyKey] = useState(0)
  const [seedGoal, setSeedGoal] = useState<ParsedGoal | null>(null)
  const [seedContract, setSeedContract] = useState<ParsedContract | null>(null)

  useEffect(() => {
    setMode(roleSetToCreateMode(roleSet))
  }, [roleSet])

  useEffect(() => {
    track("page_create", { onboarding, set: setParam || roleSet })
  }, [onboarding, setParam, roleSet])

  function switchMode(next: CreateMode) {
    setMode(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set("set", next === "contract" ? ROLES.others.set : ROLES.self.set)
    router.replace(`/create?${params.toString()}`)
  }

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
    switchMode("goal")
  }

  function applyContract(contract: ParsedContract) {
    setMode("contract")
    setSeedContract(contract)
    setSeedGoal(null)
    setApplyKey((k) => k + 1)
    switchMode("contract")
  }

  const activeRole = mode === "goal" ? ROLES.self : ROLES.others

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-rise">
      <div>
        <Link
          href={`/create${onboarding ? "?onboarding=1" : ""}`}
          className="text-sm font-semibold text-seal hover:underline"
        >
          ← 重新选角色
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-seal">
          {activeRole.navLabel}
        </p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight">
          {activeRole.createLabel}
        </h1>
        <p className="mt-2 text-sm text-muted">{activeRole.description}</p>
      </div>

      {onboarding && mode === "goal" && (
        <div className="rounded border border-seal/25 bg-seal-soft/50 px-4 py-3 text-sm text-ink">
          <p className="font-semibold">欢迎加入兑一兑</p>
          <p className="mt-1 text-muted">
            建议先写一条带奖励的承诺。也可邀请见证人——对方会在「他人」侧确认。
          </p>
        </div>
      )}

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
              识别到多条承诺 · 点击填入
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
              识别到多份他人项目 · 点击填入
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

      <div className="flex gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => switchMode("goal")}
          className={`relative px-4 py-2 text-sm font-semibold transition ${
            mode === "goal" ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {ROLES.self.projectLabel}
          {mode === "goal" && <span className="absolute inset-x-2 -bottom-3 h-0.5 bg-seal" />}
        </button>
        <button
          type="button"
          onClick={() => switchMode("contract")}
          className={`relative px-4 py-2 text-sm font-semibold transition ${
            mode === "contract" ? "text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {ROLES.others.projectLabel}
          {mode === "contract" && <span className="absolute inset-x-2 -bottom-3 h-0.5 bg-seal" />}
        </button>
      </div>

      {mode === "goal" ? (
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
  const users = useOtherUsers()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await createGoal({
        title,
        description: description || undefined,
        reward,
        deadline: deadline || undefined,
        witnessUserId: witnessUserId || undefined,
      })
      track("create_goal", { hasWitness: Boolean(witnessUserId), onboarding: Boolean(onboarding) })
      if (witnessUserId) track("invite_witness")
      router.push(ROLES.self.route)
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
          <FormLabel required>承诺标题</FormLabel>
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
        <div>
          <FormLabel>截止日期</FormLabel>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <FormLabel>见证人（建议 1 人，可不选）</FormLabel>
          <UserSelect
            value={witnessUserId}
            onChange={setWitnessUserId}
            users={users}
            emptyLabel="稍后再邀请"
          />
          <p className="mt-1 text-xs text-muted">
            找一个在乎你说到做到的人；对方确认见证后，你达成时对方也会获得成就点（信任分 +3）。
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {loading ? "创建中..." : onboarding ? "写下我的第一条承诺" : "创建给自己的项目"}
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
  const [partyUserId, setPartyUserId] = useState("")
  const [parties, setParties] = useState<{ id: string; name: string; role: string }[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const users = useOtherUsers(parties.map((p) => p.id))

  useEffect(() => {
    if (!seed?.parties?.length || users.length === 0) return
    const resolved = seed.parties
      .map((name) => users.find((u) => u.name === name))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((u) => ({ id: u.id, name: u.name, role: "promisee" }))
    if (resolved.length) setParties(resolved)
  }, [seed, users])

  function addParty() {
    if (!partyUserId) return
    const u = users.find((x) => x.id === partyUserId)
    if (!u) return
    if (parties.some((p) => p.id === u.id)) {
      setError("该用户已添加")
      return
    }
    setParties([...parties, { id: u.id, name: u.name, role: "promisee" }])
    setPartyUserId("")
    setError("")
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
      setError("请至少选择一位真实用户作为对方")
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
      router.push(ROLES.others.route)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "创建失败")
    } finally {
      setLoading(false)
    }
  }

  const otherUsers = users

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        {seed && (
          <p className="rounded border border-ok/20 bg-ok-soft px-3 py-2 text-xs text-ok">
            已根据语音/文字识别填入；对方须为已注册用户，可继续修改后提交
          </p>
        )}
        {error && (
          <p className="rounded border border-seal/30 bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
        )}
        <div>
          <FormLabel required>项目标题</FormLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：一起完成季度复盘"
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
          <FormLabel required>对方（真实用户）</FormLabel>
          <div className="flex gap-2">
            <UserSelect
              value={partyUserId}
              onChange={setPartyUserId}
              users={otherUsers}
              className="input-field flex-1"
            />
            <button type="button" onClick={addParty} className="rounded border border-line px-4 py-2 text-sm hover:border-ink">
              添加
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">给他人项目须多用户参与；不支持虚构姓名。</p>
          {parties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {parties.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 rounded bg-paper-deep px-3 py-1 text-sm">
                  {p.name}
                  <button type="button" onClick={() => setParties(parties.filter((x) => x.id !== p.id))} className="text-muted hover:text-ink">&times;</button>
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
          {loading ? "创建中..." : "创建给别人的项目"}
        </button>
      </form>
    </Card>
  )
}
