import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import Database from 'libsql'

import { seedSiteSettings } from '@/features/site-settings/seed/seed-site-settings'

const siteSettingsTable = 'site_settings'

type BootstrapAction = 'fail' | 'init' | 'skip'

export type DockerBootstrapDecision = {
  action: BootstrapAction
  reason: string
}

export type DockerBootstrapResult = {
  databasePath: string
  status: 'initialized' | 'skipped'
}

function formatJSON(value: unknown): string {
  return JSON.stringify(value)
}

export function resolveFileDatabasePath(databaseURL = process.env.DATABASE_URL): string {
  const value = databaseURL?.trim()

  if (!value) {
    throw new Error('DATABASE_URL is required for Docker database initialization.')
  }

  if (!value.startsWith('file:')) {
    throw new Error(`Docker database initialization only supports file: SQLite URLs: ${value}`)
  }

  if (value === 'file::memory:' || value === 'file:memory:') {
    throw new Error('Docker database initialization requires a persistent SQLite file.')
  }

  const rawPath = value.startsWith('file://') ? new URL(value).pathname : value.slice('file:'.length)
  const decodedPath = decodeURIComponent(rawPath)

  if (!decodedPath) {
    throw new Error(`DATABASE_URL does not include a SQLite file path: ${value}`)
  }

  return path.isAbsolute(decodedPath) ? decodedPath : path.resolve(process.cwd(), decodedPath)
}

export async function readSQLiteUserTables(databasePath: string): Promise<string[]> {
  await fs.mkdir(path.dirname(databasePath), {
    recursive: true,
  })

  const db = new Database(databasePath)

  try {
    const rows = db
      .prepare(
        "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name",
      )
      .all() as Array<{ name: string }>

    return rows.map((row) => row.name)
  } finally {
    db.close()
  }
}

export function getDockerBootstrapDecision(tableNames: string[]): DockerBootstrapDecision {
  if (tableNames.includes(siteSettingsTable)) {
    return {
      action: 'skip',
      reason: `${siteSettingsTable} already exists`,
    }
  }

  if (tableNames.length > 0) {
    return {
      action: 'fail',
      reason: `existing tables found without ${siteSettingsTable}: ${tableNames.join(', ')}`,
    }
  }

  return {
    action: 'init',
    reason: 'database is empty',
  }
}

async function initializePayloadSchemaAndSettings() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('docker:init must run with NODE_ENV unset or set to development.')
  }

  process.env.DISABLE_PAYLOAD_HMR ??= 'true'

  const [{ getPayload }, configModule] = await Promise.all([
    import('payload'),
    import('@/payload.config'),
  ])

  const payload = await getPayload({
    config: await configModule.default,
  })

  try {
    await seedSiteSettings(payload)
  } finally {
    await payload.destroy()
  }
}

export async function bootstrapDockerDatabase(): Promise<DockerBootstrapResult> {
  const databasePath = resolveFileDatabasePath()
  const tableNames = await readSQLiteUserTables(databasePath)
  const decision = getDockerBootstrapDecision(tableNames)

  if (decision.action === 'skip') {
    return {
      databasePath,
      status: 'skipped',
    }
  }

  if (decision.action === 'fail') {
    throw new Error(
      `Refusing to initialize Docker database because ${decision.reason}. Back up or recreate the zblog-data volume before retrying.`,
    )
  }

  await initializePayloadSchemaAndSettings()

  return {
    databasePath,
    status: 'initialized',
  }
}

async function main() {
  const result = await bootstrapDockerDatabase()

  console.log(
    formatJSON({
      ok: true,
      ...result,
    }),
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
