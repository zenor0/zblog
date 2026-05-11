import 'dotenv/config'

import fs from 'node:fs/promises'

import { assertSafeLocalStateReset, getLocalStateResetPlan } from '@/shared/runtime/local-state-reset'

async function main() {
  const plan = getLocalStateResetPlan()

  assertSafeLocalStateReset(plan)

  await fs.rm(plan.targetPath, {
    force: true,
    recursive: true,
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        reset: plan.label,
        targetPath: plan.targetPath,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
