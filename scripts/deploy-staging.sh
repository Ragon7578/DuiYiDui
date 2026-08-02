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

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "[deploy] 未找到 docker compose / docker-compose。请安装 Docker Engine + Compose 插件，或 docker-compose。" >&2
    exit 1
  fi
}

if ! docker info >/dev/null 2>&1; then
  echo "[deploy] Docker daemon 未运行（无法连接 docker.sock）。" >&2
  echo "[deploy] macOS：启动 Docker Desktop / OrbStack，或 colima start；云主机：确认 docker 服务已起。" >&2
  exit 1
fi

echo "[deploy] compose build & up..."
compose up -d --build

echo "[deploy] waiting for API health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:4000/api/health" | grep -q '"status":"ok"'; then
    echo "[deploy] API healthy"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "[deploy] API health timeout" >&2
    compose ps
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
echo "[deploy] 公网：按 deploy/Caddyfile 挂 HTTPS 后改 .env 域名并重新 compose up -d --build web"
