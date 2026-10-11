#!/usr/bin/env bash
# Vercel 构建：临时切换到 PostgreSQL schema + 迁移 + 种子 + Next build
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL 未设置（需要 Neon Postgres 连接串）" >&2
  exit 1
fi

echo "==> 使用 PostgreSQL schema"
cp prisma/schema.postgresql.prisma prisma/schema.prisma

echo "==> 切换 migrations 为 PostgreSQL 版本"
rm -rf prisma/migrations
cp -R prisma/migrations-postgresql prisma/migrations

echo "==> prisma generate"
npx prisma generate

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> prisma db seed（V1 演示数据）"
npx prisma db seed

echo "==> next build"
npx next build

echo "==> Vercel build 完成"
