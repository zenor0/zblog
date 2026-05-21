import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import Database from 'libsql'

export const dockerSchemaReadyTable = 'site_settings'

type BootstrapAction = 'fail' | 'init' | 'skip'

export type DockerBootstrapDecision = {
  action: BootstrapAction
  reason: string
}

export type DockerBootstrapResult = {
  databasePath: string
  status: 'initialized' | 'skipped'
  templateDatabasePath?: string
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

  const rawPath = value.startsWith('file://')
    ? new URL(value).pathname
    : value.slice('file:'.length)
  const decodedPath = decodeURIComponent(rawPath)

  if (!decodedPath) {
    throw new Error(`DATABASE_URL does not include a SQLite file path: ${value}`)
  }

  return path.isAbsolute(decodedPath) ? decodedPath : path.resolve(process.cwd(), decodedPath)
}

export function resolveDockerTemplateDatabasePath(
  templateDatabasePath = process.env.ZBLOG_DOCKER_TEMPLATE_DB_PATH,
): string {
  const configuredPath = templateDatabasePath?.trim() || 'docker-template.db'

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath)
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
  if (tableNames.includes(dockerSchemaReadyTable)) {
    return {
      action: 'skip',
      reason: `${dockerSchemaReadyTable} already exists`,
    }
  }

  if (tableNames.length > 0) {
    return {
      action: 'fail',
      reason: `existing tables found without ${dockerSchemaReadyTable}: ${tableNames.join(', ')}`,
    }
  }

  return {
    action: 'init',
    reason: 'database is empty',
  }
}

async function removeSQLiteSidecars(databasePath: string): Promise<void> {
  await Promise.all(
    [`${databasePath}-shm`, `${databasePath}-wal`].map((sidecarPath) =>
      fs.rm(sidecarPath, {
        force: true,
      }),
    ),
  )
}

export async function copyDockerTemplateDatabase(args: {
  databasePath: string
  templateDatabasePath: string
}): Promise<void> {
  if (args.databasePath === args.templateDatabasePath) {
    throw new Error('Docker database path and template database path must be different.')
  }

  await fs.access(args.templateDatabasePath)

  const templateTableNames = await readSQLiteUserTables(args.templateDatabasePath)

  if (!templateTableNames.includes(dockerSchemaReadyTable)) {
    throw new Error(
      `Docker template database is missing ${dockerSchemaReadyTable}: ${args.templateDatabasePath}`,
    )
  }

  await fs.mkdir(path.dirname(args.databasePath), {
    recursive: true,
  })
  await removeSQLiteSidecars(args.databasePath)
  await fs.copyFile(args.templateDatabasePath, args.databasePath)
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

  const templateDatabasePath = resolveDockerTemplateDatabasePath()

  await copyDockerTemplateDatabase({
    databasePath,
    templateDatabasePath,
  })

  return {
    databasePath,
    status: 'initialized',
    templateDatabasePath,
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
