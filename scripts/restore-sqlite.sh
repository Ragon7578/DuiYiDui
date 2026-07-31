#!/usr/bin/env bash
# 从备份恢复 SQLite（会覆盖当前库，慎用）
# 用法: bash scripts/restore-sqlite.sh backups/contract-spirit-XXXX.db
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "用法: bash scripts/restore-sqlite.sh <备份文件.db>" >&2
  exit 1
fi

SRC="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
if [[ ! -f "$SRC" ]]; then
  echo "[restore] 备份不存在: $SRC" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${DB_PATH:-$ROOT/apps/api/data/contract-spirit.db}"

read -r -p "[restore] 将覆盖 ${DEST}，确认? [y/N] " ans
if [[ "${ans:-}" != "y" && "${ans:-}" != "Y" ]]; then
  echo "已取消"
  exit 0
fi

mkdir -p "$(dirname "$DEST")"
cp -a "$SRC" "$DEST"
echo "[restore] ${SRC} → ${DEST}"
echo "[restore] 建议: npm run db:verify"
