import { afterEach, describe, expect, test, vi } from 'vitest'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const configPath = pathToFileURL(path.resolve(process.cwd(), 'playwright.config.ts')).href

async function loadPlaywrightConfig() {
  vi.resetModules()

  return import(`${configPath}?t=${Date.now()}`)
}

describe('playwright config', () => {
  afterEach(() => {
    delete process.env.PLAYWRIGHT_BASE_URL
    vi.resetModules()
  })

  test(
    'probes the admin route when reusing an already running server',
    { timeout: 15000 },
    async () => {
      process.env.PLAYWRIGHT_BASE_URL = 'http://localhost:3001'

      const { default: config } = await loadPlaywrightConfig()

      expect(config.webServer).toMatchObject({
        reuseExistingServer: true,
        url: 'http://localhost:3001/admin',
      })
    },
  )
})
