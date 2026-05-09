import path from 'path'
import { DatabaseSync } from 'node:sqlite'

import { defaultDatabasePath } from '@/lib/runtime-paths'

const localeRenames = [
  {
    from: 'zh-CN',
    to: 'zh-Hans',
  },
] as const

const tableUpdates = [
  {
    columns: ['translated_from_locale', '_locale'],
    table: 'posts_locales',
  },
  {
    columns: ['version_translated_from_locale', '_locale'],
    table: '_posts_v_locales',
  },
  {
    columns: ['published_locale'],
    table: '_posts_v',
  },
  {
    columns: ['_locale'],
    table: 'site_settings_locales',
  },
  {
    columns: ['_locale'],
    table: 'site_settings_footer_links_locales',
  },
  {
    columns: ['_locale'],
    table: 'site_settings_footer_records_locales',
  },
] as const

function resolveDatabasePaths(): string[] {
  const cliArguments = process.argv.slice(2).map((entry) => entry.trim()).filter(Boolean)

  if (cliArguments.length > 0) {
    return cliArguments.map((entry) => path.resolve(process.cwd(), entry))
  }

  const databaseUrl = process.env.DATABASE_URL?.replace(/^file:/, '').trim()

  if (databaseUrl) {
    return [path.resolve(process.cwd(), databaseUrl)]
  }

  return [defaultDatabasePath]
}

function hasTable(database: DatabaseSync, tableName: string): boolean {
  const row = database
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
    .get(tableName) as { name: string } | undefined

  return Boolean(row)
}

function getTableColumns(database: DatabaseSync, tableName: string): Set<string> {
  if (!hasTable(database, tableName)) {
    return new Set()
  }

  const rows = database.prepare(`SELECT name FROM pragma_table_info('${tableName}')`).all() as Array<{
    name: string
  }>

  return new Set(rows.map((row) => row.name))
}

function migrateDatabase(databasePath: string) {
  const database = new DatabaseSync(databasePath)
  let totalChanges = 0

  try {
    database.exec('BEGIN')

    for (const { table, columns } of tableUpdates) {
      const availableColumns = getTableColumns(database, table)

      if (availableColumns.size === 0) {
        continue
      }

      for (const column of columns) {
        if (!availableColumns.has(column)) {
          continue
        }

        for (const rename of localeRenames) {
          const statement = database.prepare(`UPDATE "${table}" SET "${column}" = ? WHERE "${column}" = ?`)
          const result = statement.run(rename.to, rename.from)

          totalChanges += Number(result.changes ?? 0)
        }
      }
    }

    database.exec('COMMIT')
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  } finally {
    database.close()
  }

  console.log(JSON.stringify({ databasePath, totalChanges }, null, 2))
}

for (const databasePath of resolveDatabasePaths()) {
  migrateDatabase(databasePath)
}
