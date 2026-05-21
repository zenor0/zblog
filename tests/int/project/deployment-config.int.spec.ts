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
    const sitemapRoute = readProjectFile('src/app/sitemap.ts')

    expect(nextConfig).toMatch(/output:\s*['"]standalone['"]/)
    expect(sitemapRoute).toMatch(/dynamic\s*=\s*['"]force-dynamic['"]/)
    expect(dockerfile).toContain('ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000')
    expect(dockerfile).toContain('NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL"')
    expect(dockerfile).toContain('PAYLOAD_SECRET=zblog-build-placeholder-secret')
    expect(dockerfile).toContain('ZBLOG_STATE_DIR=/tmp/zblog-build-state')
    expect(dockerfile).toContain('DATABASE_URL=file:/tmp/zblog-build-state/zblog-build.db')
    expect(dockerfile).toContain('@libsql+linux-x64-musl@0.4.7')
    expect(dockerfile).toContain('ln -sfn ../../../@libsql+linux-x64-musl@0.4.7')
    expect(dockerfile).toContain('FROM deps AS init')
    expect(dockerfile).toContain(
      'CMD ["node", "--no-deprecation", "--import=tsx/esm", "src/scripts/docker-init.ts"]',
    )
    expect(dockerfile).not.toContain('ENV PAYLOAD_SECRET')
    expect(dockerfile).not.toContain('ARG PAYLOAD_SECRET')
  })

  it('runs a production app service after a one-off database init service', () => {
    const compose = parse(readProjectFile('docker-compose.yml')) as {
      services?: Record<string, Record<string, unknown>>
      volumes?: Record<string, unknown>
    }
    const serviceNames = Object.keys(compose.services ?? {})
    const zblogInit = compose.services?.['zblog-init']
    const zblog = compose.services?.zblog

    expect(serviceNames).toEqual(['zblog-init', 'zblog'])
    expect(zblogInit?.build).toEqual({
      args: {
        NEXT_PUBLIC_SITE_URL: '${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}',
      },
      context: '.',
      dockerfile: 'Dockerfile',
      target: 'init',
    })
    expect(zblogInit?.restart).toBe('no')
    expect(zblogInit?.volumes).toContain('zblog-data:/app/.data')
    expect(zblogInit?.environment).toMatchObject({
      DATABASE_URL: 'file:/app/.data/zblog.db',
      NODE_ENV: 'development',
      ZBLOG_STATE_DIR: '/app/.data',
    })
    expect(zblog?.build).toEqual({
      args: {
        NEXT_PUBLIC_SITE_URL: '${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}',
      },
      context: '.',
      dockerfile: 'Dockerfile',
      target: 'runner',
    })
    expect(zblog?.command).toBeUndefined()
    expect(zblog?.depends_on).toEqual({
      'zblog-init': {
        condition: 'service_completed_successfully',
      },
    })
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

  it('uses Docker bootstrap instead of production migrations before first release', () => {
    const packageJSON = JSON.parse(readProjectFile('package.json')) as {
      scripts?: Record<string, string>
    }
    const payloadConfig = readProjectFile('src/payload.config.ts')
    const dockerInitScript = readProjectFile('src/scripts/docker-init.ts')

    expect(packageJSON.scripts?.['docker:init']).toContain('docker-init.ts')
    expect(payloadConfig).not.toContain("from './migrations'")
    expect(payloadConfig).not.toContain('prodMigrations')
    expect(dockerInitScript).toContain('bootstrapDockerDatabase')
    expect(fs.existsSync(path.join(rootDir, 'src/migrations'))).toBe(false)
  })

  it('documents the required and optional production environment variables', () => {
    const envExample = readProjectFile('.env.example')

    expect(envExample).toContain('DATABASE_URL=file:/app/.data/zblog.db')
    expect(envExample).toContain('ZBLOG_STATE_DIR=/app/.data')
    expect(envExample).toContain('NEXT_PUBLIC_SITE_URL=https://example.com')
    expect(envExample).toContain('PAYLOAD_SECRET=')
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
    expect(readme).toContain('zblog-init')
    expect(readme).toContain('schema and site settings')
    expect(readme).toContain('docker run --rm')
    expect(readme).toContain('zblog-data')
  })
})
