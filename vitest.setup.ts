import 'dotenv/config'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

process.env.PAYLOAD_SECRET ??= 'test-payload-secret'
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000'

afterEach(() => {
  cleanup()
})
