FROM node:22.17.0-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

FROM base AS deps
RUN apk add --no-cache libc6-compat poppler-utils
WORKDIR /app

COPY .npmrc* package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN \
  export NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL"; \
  export PAYLOAD_SECRET=zblog-build-placeholder-secret; \
  export ZBLOG_STATE_DIR=/tmp/zblog-build-state; \
  export DATABASE_URL=file:/tmp/zblog-build-state/zblog-build.db; \
  if [ -f yarn.lock ]; then NODE_ENV=development yarn run docker:init && yarn run build; \
  elif [ -f package-lock.json ]; then NODE_ENV=development npm run docker:init && npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && NODE_ENV=development pnpm run docker:init && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi
RUN mkdir -p public

FROM deps AS init
WORKDIR /app

ENV NODE_ENV=development
ENV DISABLE_PAYLOAD_HMR=true
ENV ZBLOG_STATE_DIR=/app/.data
ENV DATABASE_URL=file:/app/.data/zblog.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY . .

RUN mkdir -p .data
RUN chown nextjs:nodejs .data

USER nextjs

CMD ["node", "--no-deprecation", "--import=tsx/esm", "src/scripts/docker-init.ts"]

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
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@libsql+linux-x64-musl@0.4.7 ./node_modules/.pnpm/@libsql+linux-x64-musl@0.4.7
RUN ln -sfn ../../../@libsql+linux-x64-musl@0.4.7/node_modules/@libsql/linux-x64-musl ./node_modules/.pnpm/libsql@0.4.7/node_modules/@libsql/linux-x64-musl
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
