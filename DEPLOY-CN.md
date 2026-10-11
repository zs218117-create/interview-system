# 腾讯云轻量应用服务器（Lighthouse）部署说明

适用：Ubuntu 24.04，国内访问；本机跑 **Postgres + Next.js + Caddy(:80)**，延迟优于连境外 Neon。

## 架构

| 容器 | 作用 |
|------|------|
| `postgres` | PostgreSQL 16，数据卷 `pgdata` |
| `app` | Next.js standalone + Prisma（启动时 `migrate deploy`） |
| `caddy` | 反向代理 `:80` → `app:3000` |

上传文件落在 Docker 卷 `uploads`。

相关文件：

- `Dockerfile`
- `docker-compose.yml`
- `deploy/Caddyfile`
- `.env.lighthouse.example` → 服务器上复制为 `.env`
- `scripts/deploy-lighthouse.sh`

## 父代理 / 运维在 SSH 上要做的事

假设代码已在服务器目录，例如 `/opt/interview-system`：

```bash
# 1. 登录服务器
ssh ubuntu@你的公网IP

# 2. 安装 git（若尚未安装）并拉取代码
sudo apt-get update -y && sudo apt-get install -y git
sudo mkdir -p /opt/interview-system
sudo chown "$USER":"$USER" /opt/interview-system
cd /opt/interview-system
git clone https://github.com/zs218117-create/interview-system.git .
# 若已 clone： git pull origin main

# 3. 配置环境变量（不要提交到 Git）
cp .env.lighthouse.example .env
nano .env
# 必改：
#   POSTGRES_PASSWORD=强密码
#   NEXTAUTH_URL=http://公网IP
#   NEXTAUTH_SECRET=$(openssl rand -base64 32)
# 首次灌演示数据：
#   RUN_SEED=true

# 4. 一键部署（会安装 Docker、构建镜像、启动）
sudo bash scripts/deploy-lighthouse.sh

# 5. 看日志
docker compose logs -f app
```

浏览器打开：`http://公网IP/`  

演示账号见 `README.md`（默认密码 `Demo1234!`）。**确认能登录后，把 `.env` 里 `RUN_SEED=false`，再执行 `docker compose up -d app`**，避免以后重启再次清库灌种子。

## 安全组 / 防火墙

- 放行 **TCP 80**（HTTP）
- 若只用 IP 访问，暂不需 443
- **不要**对公网放行 5432

```bash
# Ubuntu ufw 示例
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

## 常用命令

```bash
cd /opt/interview-system
docker compose ps
docker compose logs -f app
docker compose restart app
docker compose pull && docker compose up -d --build

# 仅执行迁移（一般启动时已自动跑）
docker compose exec app sh -c 'cd /opt/prisma-tools && npx prisma migrate deploy --schema=./prisma/schema.prisma'

# 手动种子（会清空并重建演示数据！）
docker compose exec -e DATABASE_URL app sh -c 'cd /opt/prisma-tools && npx prisma db seed --schema=./prisma/schema.prisma'
```

## 域名（可选）

1. 域名解析 A 记录到服务器 IP  
2. 备案（国内）完成后，改 `NEXTAUTH_URL=https://你的域名`  
3. 扩展 `deploy/Caddyfile` 做 HTTPS（可再开 443）

## 与 Vercel/Neon 的关系

- 国内正式用户：**优先本方案（VPS 本地 Postgres）**
- 境外试用仍可用 Vercel + Neon（见 `DEPLOY.md`）

## 密钥

`.env` / `.env.lighthouse` **禁止进 Git**。只把 `.env.lighthouse.example` 留在仓库。
