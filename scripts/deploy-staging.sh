#!/usr/bin/env bash
# Staging / 公网一键部署（Docker Compose）
# 用法: cp .env.example .env && 编辑后 bash scripts/deploy-staging.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "[deploy] 请先复制 .env.example 为 .env 并填写" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ "${JWT_SECRET:-}" == "请换成足够长的随机字符串" ]] || [[ -z "${JWT_SECRET:-}" ]]; then
  echo "[deploy] 请在 .env 中设置强随机 JWT_SECRET" >&2
  exit 1
fi

echo "[deploy] docker compose build & up..."
docker compose up -d --build

echo "[deploy] waiting for API health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:4000/api/health" | grep -q '"status":"ok"'; then
    echo "[deploy] API healthy"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "[deploy] API health timeout" >&2
    docker compose ps
    exit 1
  fi
done

API_URL="${API_URL:-http://localhost:4000}"
if [[ -n "${FEEDBACK_ADMIN_KEY:-}" ]]; then
  export FEEDBACK_ADMIN_KEY
fi
if [[ -n "${REGISTRATION_INVITE_CODE:-}" ]]; then
  export REGISTRATION_INVITE_CODE
fi

echo "[deploy] smoke @ ${API_URL}"
API_URL="$API_URL" bash scripts/smoke.sh

echo "[deploy] OK — Web http://localhost:3000 · API ${API_URL}"
echo "[deploy] 公网：按 deploy/Caddyfile 挂 HTTPS 后改 .env 域名并 docker compose up -d --build web"
