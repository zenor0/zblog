import { describe, expect, test, vi } from 'vitest'
import { retryOnSqliteBusy } from '../../helpers/retryOnSqliteBusy'

describe('retryOnSqliteBusy', () => {
  test('retries when SQLITE_BUSY is nested in the cause chain', async () => {
    const operation = vi.fn(async () => {
      if (operation.mock.calls.length < 3) {
        const sqliteBusyCause = new Error('database is locked')
        ;(sqliteBusyCause as Error & { code?: string }).code = 'SQLITE_BUSY'

        const libsqlError = new Error('SQLITE_BUSY: database is locked', {
          cause: sqliteBusyCause,
        })

        throw new Error('Failed query: delete from "payload_preferences"', {
          cause: libsqlError,
        })
      }

      return 'ok'
    })

    await expect(
      retryOnSqliteBusy(operation, {
        attempts: 3,
        delayMs: 0,
      }),
    ).resolves.toBe('ok')

    expect(operation).toHaveBeenCalledTimes(3)
  })
})
