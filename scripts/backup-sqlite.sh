#!/usr/bin/env bash
# 备份 Docker 卷中的 SQLite（或本地 DB_PATH）
# 用法:
#   bash scripts/backup-sqlite.sh
#   DB_PATH=./apps/api/data/contract-spirit.db bash scripts/backup-sqlite.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"

if [[ -n "${DB_PATH:-}" && -f "$DB_PATH" ]]; then
  DEST="${OUT_DIR}/contract-spirit-${STAMP}.db"
  cp -a "$DB_PATH" "$DEST"
  echo "[backup] copied ${DB_PATH} → ${DEST}"
  exit 0
fi

if docker compose -f "$ROOT/docker-compose.yml" ps --status running 2>/dev/null | grep -q api; then
  DEST="${OUT_DIR}/contract-spirit-${STAMP}.db"
  docker compose -f "$ROOT/docker-compose.yml" exec -T api \
    node -e "require('fs').copyFileSync(process.env.DB_PATH||'/data/contract-spirit.db','/tmp/backup.db')"
  docker compose -f "$ROOT/docker-compose.yml" cp api:/tmp/backup.db "$DEST"
  echo "[backup] docker volume → ${DEST}"
  exit 0
fi

LOCAL_DB="$ROOT/apps/api/data/contract-spirit.db"
if [[ -f "$LOCAL_DB" ]]; then
  DEST="${OUT_DIR}/contract-spirit-${STAMP}.db"
  cp -a "$LOCAL_DB" "$DEST"
  echo "[backup] copied ${LOCAL_DB} → ${DEST}"
  exit 0
fi

echo "[backup] 未找到数据库。设置 DB_PATH，或先 docker compose up / npm run seed" >&2
exit 1
