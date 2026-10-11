# 腾讯云 Lighthouse Ubuntu 24.04：Next standalone + Prisma PG + OpenSSL 3
FROM node:20-bookworm-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# postinstall 需要 schema；构建阶段用占位库地址
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma && npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 镜像内固定使用 PostgreSQL schema 与迁移
COPY prisma/schema.postgresql.prisma ./prisma/schema.prisma
RUN rm -rf ./prisma/migrations && cp -R ./prisma/migrations-postgresql ./prisma/migrations
ENV NEXT_TELEMETRY_DISABLED=1
# generate 不需要真实数据库
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update -y && apt-get install -y --no-install-recommends \
    openssl ca-certificates postgresql-client \
    poppler-utils \
    tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 独立 Prisma CLI 工具链（migrate + seed）
WORKDIR /opt/prisma-tools
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
RUN npm init -y >/dev/null 2>&1 \
    && npm install prisma@5.22.0 @prisma/client@5.22.0 tsx bcryptjs \
    && npx prisma generate --schema=./prisma/schema.prisma \
    && chown -R nextjs:nodejs /opt/prisma-tools

WORKDIR /app
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh \
    && mkdir -p /app/uploads \
    && chown -R nextjs:nodejs /app/uploads /app/prisma /app/docker-entrypoint.sh /app/package.json

USER nextjs
EXPOSE 3000
VOLUME ["/app/uploads"]
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
