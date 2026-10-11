#!/usr/bin/env bash
# 在腾讯云 Lighthouse Ubuntu 24.04 上一键部署（需 root 或可 sudo）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 检查 / 安装 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y docker-compose-plugin || true
fi
docker --version
docker compose version

if [[ ! -f .env ]]; then
  if [[ -f .env.lighthouse.example ]]; then
    cp .env.lighthouse.example .env
    echo "已生成 .env（来自 .env.lighthouse.example），请编辑 POSTGRES_PASSWORD / NEXTAUTH_* 后再执行本脚本。"
    echo "  nano $ROOT/.env"
    exit 1
  fi
  echo "缺少 .env，请先根据 .env.lighthouse.example 创建。" >&2
  exit 1
fi

# 粗检必填项（不打印值）
python3 - <<'PY'
from pathlib import Path
keys=set()
for ln in Path('.env').read_text().splitlines():
    s=ln.strip()
    if s and not s.startswith('#') and '=' in s:
        keys.add(s.split('=',1)[0].strip())
need=['POSTGRES_PASSWORD','NEXTAUTH_URL','NEXTAUTH_SECRET']
miss=[k for k in need if k not in keys]
if miss:
    raise SystemExit('ERROR: .env 缺少: '+', '.join(miss))
print('env_keys_ok')
PY

chmod 600 .env || true

echo "==> docker compose build & up"
docker compose pull caddy postgres || true
docker compose build app
docker compose up -d

echo "==> 等待健康…"
sleep 5
docker compose ps

echo "==> 若首次未设 RUN_SEED=true，可手动灌演示数据："
echo "  # 编辑 .env 设 RUN_SEED=true 后： docker compose up -d app"
echo "  # 或： docker compose exec -e RUN_SEED=true app /app/docker-entrypoint.sh node -e \"process.exit(0)\""
echo "  # 更简单： docker compose exec app sh -c 'cd /opt/prisma-tools && npx prisma db seed --schema=./prisma/schema.prisma'"

echo "==> 完成。浏览器访问 http://服务器公网IP/"
echo "演示账号见 README（密码 Demo1234!）；上线后请立刻修改。"
