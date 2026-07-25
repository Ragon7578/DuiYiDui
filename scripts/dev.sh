#!/usr/bin/env bash
# 本地开发启动：先释放 3000/4000，再并行启动 API + Web
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "[dev] port ${port} busy → kill: ${pids}"
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  fi
}

free_port 4000
free_port 3000
sleep 0.3

cleanup() {
  echo "[dev] shutting down..."
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" 2>/dev/null || true
  free_port 4000
  free_port 3000
}
trap cleanup EXIT INT TERM

echo "[dev] starting API (:4000) and Web (:3000)..."
npm run dev:api &
API_PID=$!
npm run dev:web &
WEB_PID=$!

# 任一子进程退出则结束
wait -n "$API_PID" "$WEB_PID" 2>/dev/null || wait "$API_PID" "$WEB_PID"
