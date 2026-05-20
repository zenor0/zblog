import type { Payload } from 'payload'

import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { retryOnSqliteBusy } from './retryOnSqliteBusy'

export function getTestPayload(): Promise<Payload> {
  return retryOnSqliteBusy(() => getPayload({ config }), {
    attempts: 20,
    delayMs: 500,
  })
}
