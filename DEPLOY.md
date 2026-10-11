# 上线部署指南（给非技术负责人）

本系统第一版可在本机用 SQLite 跑通。正式给多位师生用时，建议：**Vercel（网站）+ Neon（Postgres 数据库）+ Vercel Blob 或兼容 S3 的存储（文件）**。

> 本文不代替付费开通账号；需要你（或指定同事）用自己的邮箱注册云服务。Grok Bot 不会替你购买服务或索要密码。


## 仓库里的双数据库策略（已就绪）

| 文件 | 用途 |
|------|------|
| `prisma/schema.prisma` | **本地默认** SQLite |
| `prisma/schema.sqlite.prisma` | SQLite 备份副本 |
| `prisma/schema.postgresql.prisma` | 生产 PostgreSQL |
| `prisma/migrations/` | SQLite 迁移（本地） |
| `prisma/migrations-postgresql/` | Postgres 初始迁移（Vercel） |
| `scripts/vercel-build.sh` | Vercel 构建：切 Postgres → migrate deploy → next build |
| `vercel.json` | `buildCommand` 指向上述脚本 |
| `docker-compose.yml` | 可选本机 Postgres |
| `.env.production.example` | 生产环境变量模板（含已生成的 `NEXTAUTH_SECRET` 示例） |

本地：`npm run build` / `npm run dev` 继续用 SQLite。  
Vercel：设置环境变量后部署即可；**不要**在本地误把 `schema.prisma` 长期改成 postgres 除非你在用 Neon/Docker。

若本地试验过 `use-postgres` 或跑过 vercel-build 脚本，用下面恢复 SQLite：

```bash
git checkout -- prisma/schema.prisma prisma/migrations
npm run db:use-sqlite
```


## 推荐路径一览

| 部分 | 推荐 | 为什么 |
|------|------|--------|
| 网站前端+接口 | [Vercel](https://vercel.com) | 与 Next.js 最省心，有免费档 |
| 数据库 | [Neon](https://neon.tech) Postgres | 有免费档，连接串即用 |
| 上传文件 | Vercel Blob 或 Cloudflare R2 / 阿里云 OSS | 生产勿用服务器本地磁盘 |

本地继续开发不必改库：保持 `provider = "sqlite"` 即可。

## Su 需要准备什么

1. 一个能收验证邮件的邮箱（注册 Vercel、Neon）
2. （可选）自己的域名；没有也可用 `*.vercel.app`
3. 决定谁当管理员；上线后立刻改掉演示密码（见下文）
4. （可选）对象存储账号——若暂时文件量很小，可先继续本地 `uploads/`，但重启/重新部署会丢文件，仅适合试用

**不需要**现在把密码发给任何人；密钥只放在 Vercel / Neon 后台的环境变量里。

## 检查清单（按顺序勾）

### A. 代码与本地确认

- [ ] 本机 `npm run build` 成功
- [ ] 用演示账号走通：登录 → 评价 → 再答 → 对比
- [ ] 阅读本仓库 `README.md` 中的功能说明

### B. 开通 Neon（数据库）

- [ ] 注册 Neon，新建项目，复制 **Connection string**（Postgres）
- [ ] 在本机临时测试（可选）：把 `DATABASE_URL` 换成该连接串，并把 `prisma/schema.prisma` 里 `provider` 改为 `"postgresql"`，执行：
  ```bash
  npx prisma migrate deploy
  npm run db:seed
  ```
- [ ] 测完若要回到本地 SQLite：改回 `provider = "sqlite"` 与 `DATABASE_URL="file:./dev.db"`

### C. 开通 Vercel（网站）

- [ ] 注册 Vercel，用 GitHub 导入本仓库（或上传）
- [ ] 在 Project → Settings → Environment Variables 添加：
  - `DATABASE_URL` = Neon 连接串
  - `NEXTAUTH_URL` = 你的站点 URL（如 `https://xxx.vercel.app`）
  - `NEXTAUTH_SECRET` = 随机长字符串（可用 `openssl rand -base64 32`）
- [ ] Build 命令：`npm run build`；Install：`npm install`
- [ ] **重要**：部署前确保生产用的 schema 为 `postgresql`（可单独建 `main` 分支或在 CI 中替换）。常见做法是仓库默认 SQLite 给开发，上线分支改为 Postgres。

### D. Prisma / 迁移（已准备好 Postgres 迁移）

生产构建会自动：

1. 使用 `schema.postgresql.prisma`
2. 使用 `migrations-postgresql`（单次 `20261011120000_init`，含完整表结构）
3. `prisma migrate deploy`

你在 Vercel 只需配置 `DATABASE_URL`（Neon）。本地勿改默认 SQLite，除非按 `docker-compose.yml` / `scripts/use-postgres.sh` 试验。

首次上线后如需演示数据，可在能连生产库的机器上临时执行 `npm run db:seed`（会清空并重建演示账号，正式环境慎用）。

### E. 文件上传（生产）

当前 V1 文件落在服务器 `uploads/`。在 Vercel 等无持久磁盘的平台上**不可靠**。Phase 3 再接 Blob/S3；试用阶段可：

- 少传文件，或
- 面试记录多用「外部链接」字段指向腾讯文档 / 网盘

环境变量占位已写在 `.env.example`（`S3_*` / `BLOB_READ_WRITE_TOKEN`）。

### F. 改掉演示密码（必做）

种子账号密码均为 `Demo1234!`。上线后任选其一：

1. **推荐**：在数据库里更新 `User.passwordHash`（用脚本对 bcrypt 哈希后写入），或  
2. 部署后不要执行 `db:seed`，改为后台手动创建真实师生账号（需后续做「管理员开户」功能），或  
3. 临时：改 `prisma/seed.ts` 里的密码字符串，再对**空库**执行一次 seed（会清空业务数据，慎用）

至少删除或禁用：`student@demo.com` / `tutor@demo.com` 等公开演示邮箱。

### G. 备份

- Neon：开启自动备份 / 定期导出
- 定期 `pg_dump` 或使用控制台「Backup」
- 若仍有本地文件，定期打包 `uploads/` 与 `prisma/dev.db`（仅本地）

## 费用直觉（会变动，以官网为准）

- Vercel Hobby + Neon Free：个人试用通常够用  
- 师生变多、文件变大后再升级付费档或上 OSS  

## 出问题先看

- 登录循环：检查 `NEXTAUTH_URL` 是否与浏览器地址一致、`NEXTAUTH_SECRET` 是否稳定（勿每次部署乱改）
- 数据库连不上：检查连接串、`sslmode`、IP 限制
- 构建失败：看 Vercel 日志里 Prisma generate / migrate 是否执行

## 当前刻意未做（Phase 3）

- 一键开通师生账号的管理后台  
- 对象存储自动上传  
- 自定义域名 HTTPS 证书以外的企业 SSO  
- 邮件通知  

有域名、Neon、Vercel 账号后，可以把连接串自行填进控制台；无需把密码发给助手。
