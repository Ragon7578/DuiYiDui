#!/usr/bin/env bash
# 主闭环冒烟：健康检查 → 注册 → 建目标 → 达成 → 兑奖 → 反馈
# 用法: API_URL=http://localhost:4000 bash scripts/smoke.sh
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
USER="s$(date +%s | tail -c 8)$RANDOM"
USER="${USER:0:20}"
PASS="password123"
EMAIL="${USER}@example.com"

die() { echo "[smoke] FAIL: $*" >&2; exit 1; }

json_field() {
  local key="$1"
  node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); const v=d${key}; if(v==null) process.exit(2); process.stdout.write(String(v))"
}

echo "[smoke] health @ ${API_URL}"
curl -sf "${API_URL}/api/health" | grep -q '"status":"ok"' || die "health"

echo "[smoke] register ${USER}"
REG_BODY="{\"username\":\"${USER}\",\"password\":\"${PASS}\",\"confirmPassword\":\"${PASS}\"}"
if [[ -n "${REGISTRATION_INVITE_CODE:-}" ]]; then
  REG_BODY="{\"username\":\"${USER}\",\"password\":\"${PASS}\",\"confirmPassword\":\"${PASS}\",\"inviteCode\":\"${REGISTRATION_INVITE_CODE}\"}"
fi
REG="$(curl -sf -X POST "${API_URL}/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "$REG_BODY")" \
  || die "register"
TOKEN="$(printf '%s' "$REG" | json_field "['token']")" || die "token"

echo "[smoke] bind email"
curl -sf -X PATCH "${API_URL}/api/profile" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\"}" >/dev/null || die "profile"

echo "[smoke] create goal"
GOAL="$(curl -sf -X POST "${API_URL}/api/goals" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"title":"冒烟目标","description":"smoke","reward":"一杯咖啡","deadline":"2099-12-31"}')" \
  || die "create goal"
GOAL_ID="$(printf '%s' "$GOAL" | json_field "['id']")" || die "goal id"

echo "[smoke] achieve"
curl -sf -X PATCH "${API_URL}/api/goals/${GOAL_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"status":"achieved","progress":100}' >/dev/null || die "achieve"

echo "[smoke] claim reward"
curl -sf -X POST "${API_URL}/api/goals/${GOAL_ID}/claim-reward" \
  -H "Authorization: Bearer ${TOKEN}" >/dev/null || die "claim"

echo "[smoke] feedback"
curl -sf -X POST "${API_URL}/api/feedback" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"message":"冒烟测试反馈，请忽略","contact":"smoke"}' >/dev/null || die "feedback"

if [[ -n "${FEEDBACK_ADMIN_KEY:-}" ]]; then
  echo "[smoke] list feedback (admin)"
  curl -sf "${API_URL}/api/feedback?limit=5" \
    -H "X-Feedback-Admin-Key: ${FEEDBACK_ADMIN_KEY}" | grep -q '"items"' || die "list feedback"
fi

echo "[smoke] OK"
