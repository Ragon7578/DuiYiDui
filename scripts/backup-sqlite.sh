#!/usr/bin/env bash
# 在线备份 SQLite（优先 SQLite backup API，WAL 安全）
# 用法: bash scripts/backup-sqlite.sh [输出路径]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -n "${1:-}" ]]; then
  npm run db:backup -w @contract-spirit/api -- "$1"
  exit 0
fi

if [[ -n "${DB_PATH:-}" && -f "$DB_PATH" ]]; then
  export DB_PATH
  npm run db:backup -w @contract-spirit/api
  exit 0
fi

if docker compose -f "$ROOT/docker-compose.yml" ps --status running 2>/dev/null | grep -q api; then
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  DEST="${BACKUP_DIR:-$ROOT/backups}/contract-spirit-${STAMP}.db"
  mkdir -p "$(dirname "$DEST")"
  docker compose -f "$ROOT/docker-compose.yml" exec -T api \
    node --import tsx apps/api/src/db/maintenance-cli.ts backup "/tmp/backup-${STAMP}.db" 2>/dev/null ||
    docker compose -f "$ROOT/docker-compose.yml" exec -T api \
      node apps/api/dist/db/maintenance-cli.js backup "/tmp/backup-${STAMP}.db"
  docker compose -f "$ROOT/docker-compose.yml" cp "api:/tmp/backup-${STAMP}.db" "$DEST"
  echo "[backup] docker → ${DEST}"
  exit 0
fi

LOCAL_DB="$ROOT/apps/api/data/contract-spirit.db"
if [[ -f "$LOCAL_DB" ]]; then
  export DB_PATH="$LOCAL_DB"
  npm run db:backup -w @contract-spirit/api
  exit 0
fi

echo "[backup] 未找到数据库。设置 DB_PATH，或先 docker compose up / npm run seed" >&2
exit 1
