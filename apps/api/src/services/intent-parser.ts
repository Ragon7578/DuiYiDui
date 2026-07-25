export interface ParsedGoal {
  title: string
  description?: string
  reward: string
  deadline?: string
}

export interface ParsedContract {
  title: string
  description?: string
  reward?: string
  parties: string[]
  clauses: string[]
}

export interface ParseResult {
  mode: "goal" | "contract"
  goals: ParsedGoal[]
  contracts: ParsedContract[]
  confidence: number
  summary: string
}

function normalizeDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0")
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseChineseDate(text: string, now = new Date()): string | undefined {
  const year = now.getFullYear()

  let m = text.match(/(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})/)
  if (m) return normalizeDate(Number(m[1]), Number(m[2]), Number(m[3]))

  m = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/)
  if (m) {
    const month = Number(m[1])
    const day = Number(m[2])
    let y = year
    const candidate = new Date(y, month - 1, day)
    if (candidate < now) y += 1
    return normalizeDate(y, month, day)
  }

  if (/本月底|这个月底/.test(text)) {
    const last = new Date(year, now.getMonth() + 1, 0)
    return normalizeDate(last.getFullYear(), last.getMonth() + 1, last.getDate())
  }

  if (/下个月底/.test(text)) {
    const last = new Date(year, now.getMonth() + 2, 0)
    return normalizeDate(last.getFullYear(), last.getMonth() + 1, last.getDate())
  }

  m = text.match(/(\d+)\s*天内|(\d+)\s*天之后|(\d+)\s*天后/)
  if (m) {
    const days = Number(m[1] || m[2] || m[3])
    const d = new Date(now)
    d.setDate(d.getDate() + days)
    return normalizeDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }

  m = text.match(/截止[日期是到至为:：\s]*([^\s，。！]+)/)
  if (m) {
    const nested = parseChineseDate(m[1], now)
    if (nested) return nested
  }

  return undefined
}

function extractReward(text: string): string {
  const patterns = [
    /奖励自己[：:\s]*([^，。！；\n]+)/,
    /奖励(?:是|为)?[：:\s]*([^，。！；\n]+)/,
    /就奖励自己([^，。！；\n]+)/,
    /就奖励([^，。！；\n]+)/,
    /给自己(?:买|弄|准备)?([^，。！；\n]+)/,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match?.[1]) {
      return match[1].replace(/^(买|弄|准备)/, "").trim() || match[1].trim()
    }
  }
  return ""
}

function extractGoalTitle(text: string): string {
  const patterns = [
    /如果我([^，。！；\n]+?)(?:就|，|,)/,
    /我想(?:要)?(?:做到|完成)?([^，。！；\n]+)/,
    /目标(?:是|为)?[：:\s]*([^，。！；\n]+)/,
    /计划([^，。！；\n]+)/,
    /承诺([^，。！；\n]+)/,
  ]
  for (const p of patterns) {
    const match = text.match(p)
    if (match?.[1]) {
      let title = match[1].trim()
      title = title.replace(/截止.+$/, "").replace(/奖励.+$/, "").replace(/[，,。！]+$/, "").trim()
      if (title) return title
    }
  }
  const cleaned = text
    .replace(/奖励.+$/, "")
    .replace(/截止.+$/, "")
    .replace(/如果我/, "")
    .replace(/就$/, "")
    .trim()
  return cleaned.slice(0, 40) || "新目标"
}

function splitSegments(text: string): string[] {
  const parts = text
    .split(/(?:另外|还有|以及|并且|然后|第一[，,]|第二[，,]|第三[，,]|；|;|\n+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
  return parts.length > 0 ? parts : [text]
}

function looksLikeContract(text: string): boolean {
  return /和.+约定|和.+一起|契约|合同|参与方|条款|双方|我们约定/.test(text)
}

function parseContract(text: string): ParsedContract {
  const partyMatch = text.match(/和([^，。！约定一起合作]+?)(?:约定|一起|合作|签)/)
  const parties = partyMatch ? [partyMatch[1].trim()] : []

  const titleMatch =
    text.match(/契约(?:标题|名称)?[：:\s]*([^，。！\n]+)/) ||
    text.match(/关于([^，。！\n]+)/) ||
    text.match(/和.+?(?:约定|一起)([^，。！\n]+)/)

  let title = titleMatch?.[1]?.trim() || "合作约定"
  title = title.replace(/奖励.+$/, "").trim() || "合作约定"

  const reward = extractReward(text) || undefined
  const clauses: string[] = []

  const clauseBlocks = text.match(/条款[：:\s]*([^。！]+)/)
  if (clauseBlocks) {
    const pieces = clauseBlocks[1]
      .split(/[、，,]/)
      .map((c) => c.replace(/^\d+[。.]\s*/, "").trim())
      .filter(Boolean)
    clauses.push(...pieces)
  }

  if (clauses.length === 0) {
    const action = text
      .replace(/和[^约定一起]+(?:约定|一起)/, "")
      .replace(/奖励.+$/, "")
      .replace(/截止.+$/, "")
      .trim()
    if (action) clauses.push(action.slice(0, 80))
  }

  if (clauses.length === 0) clauses.push("按约定完成相关事项")

  return {
    title,
    description: text.slice(0, 120),
    reward,
    parties: parties.length > 0 ? parties : ["对方"],
    clauses,
  }
}

function parseGoal(text: string): ParsedGoal {
  const reward = extractReward(text) || "兑现自我奖励"
  const deadline = parseChineseDate(text)
  const title = extractGoalTitle(text)
  let description = text
  if (description.length > 100) description = description.slice(0, 100)

  return {
    title,
    description,
    reward,
    deadline,
  }
}

/** Local rule-based parser — works without external AI keys */
export function parseIntent(text: string, preferredMode?: "goal" | "contract"): ParseResult {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (!cleaned) {
    return { mode: "goal", goals: [], contracts: [], confidence: 0, summary: "未识别到内容" }
  }

  const isContract =
    preferredMode === "contract" || (preferredMode !== "goal" && looksLikeContract(cleaned))
  const segments = splitSegments(cleaned)

  if (isContract) {
    const contracts = segments.map(parseContract)
    return {
      mode: "contract",
      goals: [],
      contracts,
      confidence: contracts[0]?.parties.length ? 0.75 : 0.55,
      summary: `识别到 ${contracts.length} 份契约草案`,
    }
  }

  const goals = segments.map(parseGoal)
  return {
    mode: "goal",
    goals,
    contracts: [],
    confidence: goals[0]?.reward && goals[0].reward !== "兑现自我奖励" ? 0.8 : 0.6,
    summary: `识别到 ${goals.length} 个目标`,
  }
}

/** Optional OpenAI enhancement when OPENAI_API_KEY is set */
export async function parseIntentWithAI(
  text: string,
  preferredMode?: "goal" | "contract"
): Promise<ParseResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return parseIntent(text, preferredMode)

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `你是兑一兑助手。把用户的口语描述解析为 JSON：
{
  "mode": "goal" | "contract",
  "goals": [{ "title": "", "description": "", "reward": "", "deadline": "YYYY-MM-DD或空" }],
  "contracts": [{ "title": "", "description": "", "reward": "", "parties": [""], "clauses": [""] }],
  "summary": ""
}
规则：目标必须有 title 和 reward；契约必须有 title、至少1个 party、至少1条 clause。
可输出多个 goals。deadline 没有就留空字符串。只用中文。`,
          },
          {
            role: "user",
            content: preferredMode
              ? `模式偏好：${preferredMode}\n用户说：${text}`
              : `用户说：${text}`,
          },
        ],
      }),
    })

    if (!res.ok) return parseIntent(text, preferredMode)
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) return parseIntent(text, preferredMode)

    const parsed = JSON.parse(content) as ParseResult
    return {
      mode: parsed.mode === "contract" ? "contract" : "goal",
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
      confidence: 0.9,
      summary: parsed.summary || "AI 已解析",
    }
  } catch {
    return parseIntent(text, preferredMode)
  }
}
