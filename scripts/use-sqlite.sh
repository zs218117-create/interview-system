#!/usr/bin/env bash
# 切回本地 SQLite（开发默认）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/prisma/schema.sqlite.prisma" "$ROOT/prisma/schema.prisma"
# 恢复 sqlite migrations 目录已在 prisma/migrations；若曾被构建脚本替换则从 git 恢复
if [[ ! -f "$ROOT/prisma/migrations/migration_lock.toml" ]] || ! grep -q sqlite "$ROOT/prisma/migrations/migration_lock.toml" 2>/dev/null; then
  echo "警告：prisma/migrations 不是 SQLite 锁。若刚跑过 vercel-build，请用 git checkout -- prisma/migrations prisma/schema.prisma"
fi
echo "已使用 SQLite schema → prisma/schema.prisma"
echo "请确认 .env 中 DATABASE_URL=\"file:./dev.db\""
npx prisma generate
