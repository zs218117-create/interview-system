# 个性化面试训练管理系统（V1）

学生 / 导师 / 助教 三端网页系统。跑通完整闭环：

**建档 → 上传资料 → 排面试 → 存记录 → 导师评价 → 学生再次回答 → 导师对比改进**

> AI 出题、AI 语音面试、会议自动同步等 **不在本版本**。

## 技术栈

- Next.js 14（App Router）+ TypeScript + Tailwind CSS
- Prisma + **SQLite**（本地文件数据库）
- NextAuth（邮箱密码 Credentials）
- 本地上传：`uploads/`（下载接口按角色鉴权）

## 快速开始

```bash
cd interview-system
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

打开：http://localhost:3000

### 演示账号（密码均为 `Demo1234!`）

| 邮箱 | 角色 | 说明 |
|------|------|------|
| `student@demo.com` | 学生 | 李明 |
| `tutor@demo.com` | 导师 | 陈老师（主导师） |
| `tutor2@demo.com` | 导师 | 王老师（数学导师） |
| `ta@demo.com` | 助教 | 小周 |
| `admin@demo.com` | 管理员 | — |

李明已分配给 **两位导师** + 一位助教；种子含一场「已完成」面试及其评价 + 再次回答，便于直接打开对比视图。

## Phase 2 演示路径（推荐按此点一遍）

1. **导师陈老师** `tutor@demo.com`  
   - 工作台打开 **李明**  
   - 「安排面试」：选题 + 腾讯会议链接  
   - 「填写评价」：写评价并勾选「布置再次回答」  
   - 「导师观察」：可写一条（王老师登录后也能再写一条，互不覆盖）  
   - 已有示例：打开评价上的「对比视图」查看首次材料 vs 再次回答，保存改进备注  

2. **学生李明** `student@demo.com`  
   - 「反馈与再答」查看评价并提交/更新文字再次回答  
   - 「我的任务」查看任务状态  

3. **助教小周** `ta@demo.com`  
   - 「任务与外课」：创建任务、标完成、录入外部补习  
   - 「面试记录」：上传文件或链接（下载需登录且有分配权限）  

4. **导师王老师** `tutor2@demo.com`  
   - 打开李明详情，另写一条观察，验证双导师并行  

## 常用命令

```bash
npm run dev
npm run build && npm start
npm run db:seed
npx prisma studio
```

上线步骤见仓库根目录 **[DEPLOY.md](./DEPLOY.md)**（Vercel + Neon 等）。

生产环境变量模板：`.env.production.example`。Vercel 构建命令已写入 `vercel.json`（`scripts/vercel-build.sh`）。

本地默认 SQLite；`npm run build` 不变。切 Postgres 试验：`npm run db:use-postgres`（详见 DEPLOY.md）。

## 切换到 PostgreSQL

1. `prisma/schema.prisma` 中 `provider = "postgresql"`
2. `.env` 中设置 Postgres `DATABASE_URL`
3. `npx prisma migrate dev && npm run db:seed`

## 功能清单

### Phase 1
- [x] 数据模型与种子、登录退出、三角色工作台
- [x] 学生档案 / 资料上传 / 课表 / 每日收获
- [x] 导师学生列表与详情只读骨架
- [x] 助教档案与记录上传骨架

### 语音录入（Web Speech API）

各文本框旁有「语音录入」按钮，使用浏览器 `SpeechRecognition`（`zh-CN`），无需付费 API。建议 Chrome；不支持时会提示「浏览器不支持语音录入」。可边说边追加，停止后仍可手动改字。

### Phase 2（本版）
- [x] 导师题库：创建题目
- [x] 导师安排个性化面试（选题 + 腾讯会议链接）
- [x] 导师填写评价、布置再次回答（同步创建任务）
- [x] 学生查看反馈并提交文字再次回答
- [x] 导师并排对比首次材料 vs 再答，保存改进备注
- [x] 双导师在学生详情写观察
- [x] 助教创建/更新任务、录入外部补习；学生/导师可见任务状态
- [x] 文档与面试记录下载鉴权（按分配关系）

### Phase 3（上线相关，未做）
- [ ] 生产部署（Vercel / 云主机）、环境变量与 HTTPS
- [ ] Postgres + 对象存储（OSS/S3）替换本地 `uploads/`
- [ ] 邮件/站内通知（新评价、再答到期）
- [ ] 账号开通与批量导入学生
- [ ] 文件类型病毒扫描与更大上传限额
- [ ] 审计日志、更细权限（只读导师等）

## 截图

- `screenshots/01-login.png`
- `screenshots/02-tutor-home.png`
- `screenshots/03-tutor-student-liming.png`
- `screenshots/04-evaluate-form.png`（Phase 2）
- `screenshots/05-student-reanswer.png`（Phase 2）
- `screenshots/06-compare-view.png`（Phase 2）
- `screenshots/07-ta-tasks.png`（Phase 2）
- `screenshots/08-evaluate-voice.png`（评价表单含语音按钮）
- `screenshots/09-reanswer-voice.png`（学生再答含语音按钮）

## 目录

```
interview-system/
├── prisma/
├── uploads/
├── screenshots/
├── src/app/          # 页面与 API
├── src/lib/          # prisma / auth / access / uploads
└── README.md
```
