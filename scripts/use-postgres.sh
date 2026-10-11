#!/usr/bin/env bash
# 本地试用 Postgres（Neon 或 docker-compose）时切换 schema
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cp "$ROOT/prisma/schema.postgresql.prisma" "$ROOT/prisma/schema.prisma"
echo "已切换为 PostgreSQL schema"
echo "请设置 DATABASE_URL 为 Postgres 连接串，然后："
echo "  rm -rf prisma/migrations && cp -R prisma/migrations-postgresql prisma/migrations"
echo "  npx prisma migrate deploy"
echo "  npm run db:seed   # 可选"
npx prisma generate
