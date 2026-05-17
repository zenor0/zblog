import fs from 'node:fs'
import path from 'node:path'

import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const rootDir = process.cwd()

function readProjectFile(filePath: string): string {
  return fs.readFileSync(path.join(rootDir, filePath), 'utf8')
}

describe('deployment container config', () => {
  it('builds a standalone Next.js server for the production Docker image', () => {
    const nextConfig = readProjectFile('next.config.mjs')
    const sitemapRoute = readProjectFile('src/app/sitemap.ts')

    expect(nextConfig).toMatch(/output:\s*['"]standalone['"]/)
    expect(sitemapRoute).toMatch(/dynamic\s*=\s*['"]force-dynamic['"]/)
  })

  it('runs a single production app service with persisted runtime state', () => {
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
    })
    expect(zblog?.command).toBeUndefined()
    expect(zblog?.depends_on).toBeUndefined()
    expect(zblog?.restart).toBe('unless-stopped')
    expect(zblog?.ports).toContain('3000:3000')
    expect(zblog?.volumes).toContain('zblog-data:/app/.data')
    expect(zblog?.environment).toMatchObject({
      DATABASE_URL: 'file:/app/.data/zblog.db',
      NODE_ENV: 'production',
      ZBLOG_STATE_DIR: '/app/.data',
    })
    expect(compose.volumes).toHaveProperty('zblog-data')
  })

  it('documents the required and optional production environment variables', () => {
    const envExample = readProjectFile('.env.example')

    expect(envExample).toContain('DATABASE_URL=file:/app/.data/zblog.db')
    expect(envExample).toContain('ZBLOG_STATE_DIR=/app/.data')
    expect(envExample).toContain('NEXT_PUBLIC_SITE_URL=')
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
})
