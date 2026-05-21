import 'dotenv/config'

import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import Database from 'libsql'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { defaultLocale } from '@/shared/i18n/locales'
import {
  dockerSchemaReadyTable,
  readSQLiteUserTables,
  resolveFileDatabasePath,
} from './docker-init'

export type DockerTemplateBuildResult = {
  databasePath: string
  status: 'built'
}

function formatJSON(value: unknown): string {
  return JSON.stringify(value)
}

async function removeSQLiteDatabaseFiles(databasePath: string): Promise<void> {
  await Promise.all(
    [databasePath, `${databasePath}-shm`, `${databasePath}-wal`].map((filePath) =>
      fs.rm(filePath, {
        force: true,
      }),
    ),
  )
}

async function checkpointSQLiteDatabase(databasePath: string): Promise<void> {
  const db = new Database(databasePath)

  try {
    db.exec('pragma wal_checkpoint(TRUNCATE)')
  } finally {
    db.close()
  }

  await Promise.all(
    [`${databasePath}-shm`, `${databasePath}-wal`].map((filePath) =>
      fs.rm(filePath, {
        force: true,
      }),
    ),
  )
}

async function initializePayloadSchema() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('docker:build-template must run with NODE_ENV unset or set to development.')
  }

  process.env.DISABLE_PAYLOAD_HMR ??= 'true'

  const payload = await getPayload({
    config: await config,
  })

  try {
    await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      fallbackLocale: false,
      locale: defaultLocale,
    })
  } finally {
    await payload.destroy()
  }
}

export async function buildDockerTemplateDatabase(): Promise<DockerTemplateBuildResult> {
  const databasePath = resolveFileDatabasePath()

  await fs.mkdir(path.dirname(databasePath), {
    recursive: true,
  })
  await removeSQLiteDatabaseFiles(databasePath)

  await initializePayloadSchema()
  await checkpointSQLiteDatabase(databasePath)

  const tableNames = await readSQLiteUserTables(databasePath)

  if (!tableNames.includes(dockerSchemaReadyTable)) {
    throw new Error(`Docker template database is missing ${dockerSchemaReadyTable}.`)
  }

  return {
    databasePath,
    status: 'built',
  }
}

async function main() {
  const result = await buildDockerTemplateDatabase()

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
