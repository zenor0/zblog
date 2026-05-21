# syntax=docker/dockerfile:1.7

FROM node:22.17.0-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

FROM base AS deps
RUN apk add --no-cache libc6-compat poppler-utils
WORKDIR /app

COPY .npmrc* package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=zblog-pnpm-store,target=/pnpm/store \
  corepack enable pnpm && pnpm config set store-dir /pnpm/store && pnpm i --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  export PAYLOAD_SECRET=zblog-build-placeholder-secret; \
  export ZBLOG_STATE_DIR=/tmp/zblog-build-state; \
  export DATABASE_URL=file:/app/docker-template.db; \
  corepack enable pnpm && NODE_ENV=development pnpm run docker:build-template && pnpm run build
RUN \
  corepack enable pnpm && pnpm exec esbuild src/scripts/docker-init.ts --bundle --platform=node --target=node22 --format=esm --external:libsql --banner:js="import { createRequire as __createRequire } from 'node:module'; var require = __createRequire(import.meta.url);" --outfile=docker-init.mjs
RUN mkdir -p public

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ZBLOG_STATE_DIR=/app/.data
ENV DATABASE_URL=file:/app/.data/zblog.db
ENV ZBLOG_PDF_PREVIEW_COMMAND=pdftocairo
ENV ZBLOG_PDF_RENDER_CONCURRENCY=4

RUN apk add --no-cache poppler-utils

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next .data
RUN chown nextjs:nodejs .next .data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/docker-init.mjs ./docker-init.mjs
COPY --from=builder --chown=nextjs:nodejs /app/docker-template.db ./docker-template.db
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node --no-deprecation ./docker-init.mjs && exec node server.js"]
