import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import Database from 'libsql'
import { afterEach, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const rootDir = process.cwd()
const tempDirs: string[] = []

async function createTempState() {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zblog-docker-init-'))
  tempDirs.push(stateDir)

  return {
    databasePath: path.join(stateDir, 'zblog.db'),
    stateDir,
    templateDatabasePath: path.join(stateDir, 'docker-template.db'),
  }
}

async function runDockerBuildTemplate(args: { stateDir: string; templateDatabasePath: string }) {
  return execFileAsync(
    process.execPath,
    ['--no-deprecation', '--import=tsx/esm', 'src/scripts/docker-build-template.ts'],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: `file:${args.templateDatabasePath}`,
        NODE_ENV: 'development',
        PAYLOAD_SECRET: 'test-docker-template-secret',
        SITE_URL: 'http://localhost:3000',
        ZBLOG_STATE_DIR: args.stateDir,
      },
      timeout: 60_000,
    },
  )
}

async function runDockerInit(args: {
  databasePath: string
  stateDir: string
  templateDatabasePath?: string
}) {
  return execFileAsync(
    process.execPath,
    ['--no-deprecation', '--import=tsx/esm', 'src/scripts/docker-init.ts'],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        DATABASE_URL: `file:${args.databasePath}`,
        NODE_ENV: 'development',
        PAYLOAD_SECRET: 'test-docker-init-secret',
        SITE_URL: 'http://localhost:3000',
        ...(args.templateDatabasePath
          ? {
              ZBLOG_DOCKER_TEMPLATE_DB_PATH: args.templateDatabasePath,
            }
          : {}),
        ZBLOG_STATE_DIR: args.stateDir,
      },
      timeout: 60_000,
    },
  )
}

function openDatabase(databasePath: string) {
  return new Database(databasePath)
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) =>
      fs.rm(directory, {
        force: true,
        recursive: true,
      }),
    ),
  )
})

describe('docker init script', () => {
  it('builds a Docker schema template without seeding content', async () => {
    const { stateDir, templateDatabasePath } = await createTempState()

    const { stdout } = await runDockerBuildTemplate({
      stateDir,
      templateDatabasePath,
    })
    const db = openDatabase(templateDatabasePath)

    try {
      const table = db
        .prepare("select name from sqlite_master where type = 'table' and name = 'site_settings'")
        .get()
      const settings = db.prepare('select count(*) as count from site_settings').get() as {
        count: number
      }
      const pages = db.prepare('select count(*) as count from pages').get() as {
        count: number
      }

      expect(stdout).toContain('"status":"built"')
      expect(table).toMatchObject({ name: 'site_settings' })
      expect(settings.count).toBe(0)
      expect(pages.count).toBe(0)
    } finally {
      db.close()
    }
  }, 60_000)

  it('copies the schema template for an empty SQLite database', async () => {
    const { databasePath, stateDir, templateDatabasePath } = await createTempState()

    await runDockerBuildTemplate({
      stateDir,
      templateDatabasePath,
    })

    const { stdout } = await runDockerInit({
      databasePath,
      stateDir,
      templateDatabasePath,
    })
    const db = openDatabase(databasePath)

    try {
      const table = db
        .prepare("select name from sqlite_master where type = 'table' and name = 'site_settings'")
        .get()
      const settings = db.prepare('select count(*) as count from site_settings').get() as {
        count: number
      }
      const pages = db.prepare('select count(*) as count from pages').get() as {
        count: number
      }

      expect(stdout).toContain('"status":"initialized"')
      expect(table).toMatchObject({ name: 'site_settings' })
      expect(settings.count).toBe(0)
      expect(pages.count).toBe(0)
    } finally {
      db.close()
    }
  }, 60_000)

  it('skips initialization when the site settings table already exists', async () => {
    const { databasePath, stateDir } = await createTempState()
    const db = openDatabase(databasePath)

    try {
      db.exec('create table site_settings (id integer primary key, site_name text)')
      db.exec("insert into site_settings (id, site_name) values (1, 'Existing Site')")
    } finally {
      db.close()
    }

    const { stdout } = await runDockerInit({
      databasePath,
      stateDir,
    })
    const verifyDb = openDatabase(databasePath)

    try {
      const row = verifyDb.prepare('select site_name from site_settings where id = 1').get()

      expect(stdout).toContain('"status":"skipped"')
      expect(row).toMatchObject({ site_name: 'Existing Site' })
    } finally {
      verifyDb.close()
    }
  })

  it('fails instead of mutating a partial database without site settings', async () => {
    const { databasePath, stateDir } = await createTempState()
    const db = openDatabase(databasePath)

    try {
      db.exec('create table users (id integer primary key)')
    } finally {
      db.close()
    }

    await expect(
      runDockerInit({
        databasePath,
        stateDir,
      }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('site_settings'),
    })
  })
})
