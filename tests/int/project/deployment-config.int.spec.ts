import fs from 'node:fs'
import path from 'node:path'

import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const rootDir = process.cwd()

function readProjectFile(filePath: string): string {
  return fs.readFileSync(path.join(rootDir, filePath), 'utf8')
}

describe('deployment container config', () => {
  it('declares the SQLite native runtime package for standalone tracing', () => {
    const packageJSON = JSON.parse(readProjectFile('package.json')) as {
      dependencies?: Record<string, string>
    }

    expect(packageJSON.dependencies).toHaveProperty('libsql')
  })

  it('builds a standalone Next.js server for the production Docker image', () => {
    const dockerfile = readProjectFile('Dockerfile')
    const nextConfig = readProjectFile('next.config.mjs')
    const robotsRoute = readProjectFile('src/app/robots.ts')
    const sitemapRoute = readProjectFile('src/app/sitemap.ts')

    expect(nextConfig).toMatch(/output:\s*['"]standalone['"]/)
    expect(robotsRoute).toMatch(/dynamic\s*=\s*['"]force-dynamic['"]/)
    expect(sitemapRoute).toMatch(/dynamic\s*=\s*['"]force-dynamic['"]/)
    expect(dockerfile).toContain('PAYLOAD_SECRET=zblog-build-placeholder-secret')
    expect(dockerfile).toContain('ZBLOG_STATE_DIR=/tmp/zblog-build-state')
    expect(dockerfile).toContain('DATABASE_URL=file:/app/docker-template.db')
    expect(dockerfile).toContain('pnpm run docker:build-template')
    expect(dockerfile).toContain('--outfile=docker-init.mjs')
    expect(dockerfile).toContain('--external:libsql')
    expect(dockerfile).toContain(
      'COPY --from=builder --chown=nextjs:nodejs /app/docker-template.db ./docker-template.db',
    )
    expect(dockerfile).not.toContain('FROM deps AS prod-deps')
    expect(dockerfile).not.toContain('pnpm prune --prod')
    expect(dockerfile).not.toContain('--external:@payloadcms/db-sqlite')
    expect(dockerfile).not.toContain('--external:sharp')
    expect(dockerfile).toContain(
      'COPY --from=builder --chown=nextjs:nodejs /app/docker-init.mjs ./docker-init.mjs',
    )
    expect(dockerfile).toContain(
      'CMD ["sh", "-c", "node --no-deprecation ./docker-init.mjs && exec node server.js"]',
    )
    expect(dockerfile).not.toContain('ARG NEXT_PUBLIC_SITE_URL')
    expect(dockerfile).not.toContain('NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL"')
    expect(dockerfile).not.toMatch(/node_modules\/\.pnpm\/[^\s]+@\d/)
    expect(dockerfile).not.toContain('ln -sfn')
    expect(dockerfile).not.toContain('FROM deps AS init')
    expect(dockerfile).not.toContain('--import=tsx/esm", "src/scripts/docker-init.ts"')
    expect(dockerfile).not.toContain('ENV PAYLOAD_SECRET')
    expect(dockerfile).not.toContain('ARG PAYLOAD_SECRET')
  })

  it('runs a single production app service that initializes its database before startup', () => {
    const compose = parse(readProjectFile('docker-compose.yml')) as {
      services?: Record<string, Record<string, unknown>>
      volumes?: Record<string, unknown>
    }
    const serviceNames = Object.keys(compose.services ?? {})
    const zblog = compose.services?.zblog

    expect(serviceNames).toEqual(['zblog'])
    expect(zblog?.build).toEqual({
      context: '.',
      dockerfile: 'Dockerfile',
      target: 'runner',
    })
    expect(zblog?.command).toBeUndefined()
    expect(zblog?.depends_on).toBeUndefined()
    expect(zblog?.restart).toBe('unless-stopped')
    expect(zblog?.ports).toContain('127.0.0.1:3000:3000')
    expect(zblog?.volumes).toContain('zblog-data:/app/.data')
    expect(zblog?.environment).toMatchObject({
      DATABASE_URL: 'file:/app/.data/zblog.db',
      NODE_ENV: 'production',
      ZBLOG_STATE_DIR: '/app/.data',
    })
    expect(compose.volumes).toHaveProperty('zblog-data')
  })

  it('uses Docker schema bootstrap without seeding content before first release', () => {
    const packageJSON = JSON.parse(readProjectFile('package.json')) as {
      scripts?: Record<string, string>
    }
    const payloadConfig = readProjectFile('src/payload.config.ts')
    const dockerInitScript = readProjectFile('src/scripts/docker-init.ts')
    const dockerBuildTemplateScript = readProjectFile('src/scripts/docker-build-template.ts')

    expect(packageJSON.scripts?.['docker:init']).toContain('docker-init.ts')
    expect(packageJSON.scripts?.['docker:build-template']).toContain('docker-build-template.ts')
    expect(payloadConfig).not.toContain("from './migrations'")
    expect(payloadConfig).not.toContain('prodMigrations')
    expect(dockerInitScript).toContain('bootstrapDockerDatabase')
    expect(dockerInitScript).toContain('ZBLOG_DOCKER_TEMPLATE_DB_PATH')
    expect(dockerInitScript).not.toContain('payload.findGlobal')
    expect(dockerBuildTemplateScript).toContain('payload.findGlobal')
    expect(dockerInitScript).not.toContain('seedSiteSettings')
    expect(dockerInitScript).not.toContain('seedSitePages')
    expect(dockerBuildTemplateScript).not.toContain('seedSiteSettings')
    expect(dockerBuildTemplateScript).not.toContain('seedSitePages')
    expect(fs.existsSync(path.join(rootDir, 'src/migrations'))).toBe(false)
  })

  it('documents the required and optional production environment variables', () => {
    const envExample = readProjectFile('.env.example')

    expect(envExample).toContain('DATABASE_URL=file:/app/.data/zblog.db')
    expect(envExample).toContain('ZBLOG_STATE_DIR=/app/.data')
    expect(envExample).toContain('SITE_URL=https://example.com')
    expect(envExample).not.toContain('NEXT_PUBLIC_SITE_URL')
    expect(envExample).toContain('PAYLOAD_SECRET=')
    expect(envExample).toContain('ZBLOG_DOCKER_TEMPLATE_DB_PATH=/app/docker-template.db')
    expect(envExample).toContain('ZBLOG_PDF_PREVIEW_COMMAND=pdftocairo')
    expect(envExample).toContain('ZBLOG_PDF_RENDER_CONCURRENCY=4')
    expect(envExample).toContain('TRANSLATION_API_URL=')
    expect(envExample).toContain('TRANSLATION_API_KEY=')
  })

  it('keeps local state and build artifacts out of Docker build context', () => {
    const dockerignore = readProjectFile('.dockerignore')

    expect(dockerignore).toContain('node_modules')
    expect(dockerignore).toContain('.next')
    expect(dockerignore).toContain('.data')
    expect(dockerignore).toContain('.env')
    expect(dockerignore).toContain('.worktrees')
    expect(dockerignore).toContain('playwright-report')
    expect(dockerignore).toContain('test-results')
  })

  it('documents the single-server production deployment requirements', () => {
    const readme = readProjectFile('README.md')

    expect(readme).toContain('127.0.0.1:3000')
    expect(readme).toMatch(/Nginx|Caddy|Traefik/)
    expect(readme).toContain('openssl rand -base64 32')
    expect(readme).toContain('automatically initializes')
    expect(readme).toContain('docker-init.mjs')
    expect(readme).toContain('schema only')
    expect(readme).toContain('does not seed')
    expect(readme).toContain('Site settings')
    expect(readme).not.toContain('rebuild after')
    expect(readme).toContain('docker run --rm')
    expect(readme).toContain('zblog-data')
  })
})
