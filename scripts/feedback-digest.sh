#!/usr/bin/env bash
# 导出站内反馈并生成「给总负责人的任务简报」
# 优先走 API；若 API 不可用则直读 SQLite（DB_PATH）。
#
#   FEEDBACK_ADMIN_KEY=... ./scripts/feedback-digest.sh
#   DB_PATH=./apps/api/data/contract-spirit.db ./scripts/feedback-digest.sh
#   SINCE=2026-07-01 ./scripts/feedback-digest.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${API_URL:-http://localhost:4000}"
OPS_KEY="${FEEDBACK_ADMIN_KEY:-${FEEDBACK_OPS_KEY:-}}"
SINCE="${SINCE:-}"
DB_PATH="${DB_PATH:-$ROOT/apps/api/data/contract-spirit.db}"
OUT_DIR="${OUT_DIR:-$ROOT/docs/roadmap/feedback/digests}"
STAMP="$(date -u +%Y-%m-%d)"
WEEK="$(date +%G-W%V)"

mkdir -p "$OUT_DIR"
RAW="$OUT_DIR/${STAMP}-raw.json"
BRIEF="$OUT_DIR/${STAMP}-pm-brief.md"

export RAW BRIEF WEEK STAMP SINCE API_URL OPS_KEY DB_PATH

python3 <<'PY'
import json, os, re, sqlite3, urllib.request, urllib.parse, urllib.error
from pathlib import Path

raw_path = Path(os.environ["RAW"])
brief_path = Path(os.environ["BRIEF"])
week = os.environ["WEEK"]
stamp = os.environ["STAMP"]
since = os.environ.get("SINCE") or ""
api = os.environ.get("API_URL") or "http://localhost:4000"
ops = os.environ.get("OPS_KEY") or ""
db_path = os.environ.get("DB_PATH") or ""

def fetch_api():
    if not ops:
        return None
    q = {"limit": "500"}
    if since:
        q["since"] = since
    url = api.rstrip("/") + "/api/feedback?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"X-Feedback-Admin-Key": ops})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return json.loads(res.read().decode())
    except Exception as e:
        print(f"[digest] API unavailable ({e}); trying SQLite…")
        return None

def fetch_db():
    if not db_path or not Path(db_path).exists():
        raise SystemExit(f"No API and DB not found: {db_path}")
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    if since:
        rows = con.execute(
            """
            SELECT f.id, f.user_id, f.contact, f.message, f.created_at, u.name AS user_name
            FROM feedback f LEFT JOIN users u ON u.id = f.user_id
            WHERE f.created_at >= ?
            ORDER BY f.created_at DESC LIMIT 500
            """,
            (since,),
        ).fetchall()
    else:
        rows = con.execute(
            """
            SELECT f.id, f.user_id, f.contact, f.message, f.created_at, u.name AS user_name
            FROM feedback f LEFT JOIN users u ON u.id = f.user_id
            ORDER BY f.created_at DESC LIMIT 500
            """
        ).fetchall()
    items = [
        {
            "id": r["id"],
            "userId": r["user_id"],
            "userName": r["user_name"],
            "contact": r["contact"],
            "message": r["message"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]
    return {"count": len(items), "items": items, "source": "sqlite"}

data = fetch_api()
if data is None:
    data = fetch_db()
else:
    data["source"] = "api"

raw_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
items = data.get("items") or []

RULES = [
    ("P0-主闭环", re.compile(r"兑[现奖]|奖励|达成|进度|注册|登录|登不|打不开|崩溃|丢失|数据|主闭环")),
    ("P1-见证/监督", re.compile(r"见证|监督|约定|契约|对方|邀请")),
    ("P1-理解成本", re.compile(r"看不懂|不知道|困惑|复杂|说明|引导|空态|文案")),
    ("P2-体验", re.compile(r"慢|卡|丑|样式|手机|适配|通知")),
    ("P2-其他", re.compile(r".+")),
]
buckets = {k: [] for k, _ in RULES}
for it in items:
    msg = it.get("message") or ""
    for name, rx in RULES:
        if rx.search(msg):
            buckets[name].append(it)
            break

def esc(s):
    return (s or "").replace("|", "\\|").replace("\n", " ")

lines = [
    f"# 反馈任务简报 · {stamp}（{week}）",
    "",
    "> 收件人：**总负责人**  ",
    "> 发件角色：上线反馈运营（兑一兑）  ",
    "> 目的：根据真实反馈制定下一 Sprint 开发任务",
    "",
    "## 1. 本周征集摘要",
    "",
    "| 项 | 值 |",
    "|----|----|",
    f"| 反馈条数 | {len(items)} |",
    f"| 数据来源 | {data.get('source')} |",
    f"| 原始导出 | `{raw_path.name}` |",
    "",
]

if not items:
    lines += [
        "暂无新反馈。建议：主动邀约用户、检查反馈入口曝光。",
        "",
        "## 2. 建议开发任务（草案）",
        "",
        "- （无）本周不新增 Must；维持值班与邀请。",
        "",
    ]
else:
    lines += ["## 2. Top 主题（自动粗分，需人工复核）", ""]
    for name, _ in RULES:
        rows = buckets[name]
        if not rows:
            continue
        lines += [f"### {name}（{len(rows)}）", ""]
        for it in rows[:8]:
            who = it.get("userName") or it.get("contact") or "匿名"
            lines.append(f"- `{it.get('createdAt','')}` · {who}：{esc(it.get('message',''))[:160]}")
        if len(rows) > 8:
            lines.append(f"- … 另有 {len(rows)-8} 条见 raw JSON")
        lines.append("")

    lines += [
        "## 3. 建议开发任务（草案 → 请总负责人裁剪为 Sprint Must）",
        "",
        "| 优先级 | 建议任务 | 依据反馈主题 | 验收建议 |",
        "|--------|----------|--------------|----------|",
    ]
    task_hints = {
        "P0-主闭环": ("修通/强化注册→承诺→兑奖路径", "主路径可无指导走完；兑奖可发现"),
        "P1-见证/监督": ("打通见证人确认与监督列表可达性", "第二账号可接受见证；监督空态有 CTA"),
        "P1-理解成本": ("补齐空态/引导文案，去掉 Todo 感", "新用户 1 分钟内理解「我的/监督」"),
        "P2-体验": ("体验与性能小修（按具体条目）", "对应反馈条目关闭"),
        "P2-其他": ("分类后纳入 backlog 或暂缓", "有明确「不做」原因"),
    }
    pri = {"P0-主闭环": "P0", "P1-见证/监督": "P1", "P1-理解成本": "P1", "P2-体验": "P2", "P2-其他": "P2"}
    for name, _ in RULES:
        if not buckets[name]:
            continue
        title, ac = task_hints[name]
        lines.append(f"| {pri[name]} | {title} | {name} ×{len(buckets[name])} | {ac} |")
    lines += [
        "",
        "## 4. 总负责人确认栏",
        "",
        "- [ ] 已挑选进下一 Sprint Must：",
        "- [ ] 暂不处理（原因）：",
        "- [ ] 需补充访谈的用户/问题：",
        "",
        "## 5. 原始条目（全量短表）",
        "",
        "| 时间 | 用户 | 联系 | 内容 |",
        "|------|------|------|------|",
    ]
    for it in items:
        lines.append(
            f"| {esc(it.get('createdAt',''))} | {esc(it.get('userName') or it.get('userId') or 'anon')} | {esc(it.get('contact') or '')} | {esc(it.get('message',''))[:120]} |"
        )
    lines.append("")

brief_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"raw:   {raw_path}")
print(f"brief: {brief_path}")
PY
