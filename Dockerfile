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
RUN \
  if [ -f yarn.lock ]; then yarn esbuild src/scripts/docker-init.ts --bundle --platform=node --target=node22 --format=esm --external:libsql --external:sharp --banner:js="import { createRequire as __createRequire } from 'node:module'; var require = __createRequire(import.meta.url);" --outfile=docker-init.mjs; \
  elif [ -f package-lock.json ]; then npx esbuild src/scripts/docker-init.ts --bundle --platform=node --target=node22 --format=esm --external:libsql --external:sharp --banner:js="import { createRequire as __createRequire } from 'node:module'; var require = __createRequire(import.meta.url);" --outfile=docker-init.mjs; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm exec esbuild src/scripts/docker-init.ts --bundle --platform=node --target=node22 --format=esm --external:libsql --external:sharp --banner:js="import { createRequire as __createRequire } from 'node:module'; var require = __createRequire(import.meta.url);" --outfile=docker-init.mjs; \
  else echo "Lockfile not found." && exit 1; \
  fi
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
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@libsql+linux-x64-musl@0.4.7 ./node_modules/.pnpm/@libsql+linux-x64-musl@0.4.7
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@drizzle-team+brocli@0.10.2 ./node_modules/.pnpm/@drizzle-team+brocli@0.10.2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@esbuild+linux-x64@0.18.20 ./node_modules/.pnpm/@esbuild+linux-x64@0.18.20
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@esbuild+linux-x64@0.25.12 ./node_modules/.pnpm/@esbuild+linux-x64@0.25.12
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@esbuild-kit+core-utils@3.3.2 ./node_modules/.pnpm/@esbuild-kit+core-utils@3.3.2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/@esbuild-kit+esm-loader@2.6.5 ./node_modules/.pnpm/@esbuild-kit+esm-loader@2.6.5
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/buffer-from@1.1.2 ./node_modules/.pnpm/buffer-from@1.1.2
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/debug@4.4.3 ./node_modules/.pnpm/debug@4.4.3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/drizzle-kit@0.31.7 ./node_modules/.pnpm/drizzle-kit@0.31.7
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/esbuild-register@3.6.0_esbuild@0.25.12 ./node_modules/.pnpm/esbuild-register@3.6.0_esbuild@0.25.12
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/esbuild@0.18.20 ./node_modules/.pnpm/esbuild@0.18.20
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/esbuild@0.25.12 ./node_modules/.pnpm/esbuild@0.25.12
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/get-tsconfig@4.14.0 ./node_modules/.pnpm/get-tsconfig@4.14.0
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/ms@2.1.3 ./node_modules/.pnpm/ms@2.1.3
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/resolve-pkg-maps@1.0.0 ./node_modules/.pnpm/resolve-pkg-maps@1.0.0
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/source-map-support@0.5.21 ./node_modules/.pnpm/source-map-support@0.5.21
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm/source-map@0.6.1 ./node_modules/.pnpm/source-map@0.6.1
RUN ln -sfn ../../../@libsql+linux-x64-musl@0.4.7/node_modules/@libsql/linux-x64-musl ./node_modules/.pnpm/libsql@0.4.7/node_modules/@libsql/linux-x64-musl
RUN ln -sfn .pnpm/drizzle-kit@0.31.7/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "NODE_ENV=development DISABLE_PAYLOAD_HMR=true node --no-deprecation ./docker-init.mjs && exec node server.js"]
