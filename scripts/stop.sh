#!/usr/bin/env bash
# 停止占用 3000 / 4000 的本地开发进程
set -euo pipefail

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "[stop] kill port ${port}: ${pids}"
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  else
    echo "[stop] port ${port} free"
  fi
}

free_port 4000
free_port 3000
pkill -f "tsx watch src/index" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
echo "[stop] done"
