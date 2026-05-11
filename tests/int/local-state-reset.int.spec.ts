import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  assertSafeLocalStateReset,
  getLocalStateResetPlan,
  isPathInsideDirectory,
} from '@/lib/local-state-reset'

describe('local state reset', () => {
  it('resets the configured runtime state directory by default', () => {
    const plan = getLocalStateResetPlan()

    expect(plan.targetPath).toBe(path.resolve(process.cwd(), '.data'))
    expect(plan.label).toBe('local runtime state')
  })

  it('keeps safety checks path-boundary aware', () => {
    const directory = path.resolve(process.cwd(), '.data')

    expect(isPathInsideDirectory(path.join(directory, 'zblog.db'), directory)).toBe(true)
    expect(isPathInsideDirectory(path.resolve(process.cwd(), '.database'), directory)).toBe(false)
  })

  it('refuses to reset paths outside the project', () => {
    expect(() =>
      assertSafeLocalStateReset({
        label: 'external state',
        targetPath: path.resolve(process.cwd(), '..', 'external-state'),
      }),
    ).toThrow('outside this project')
  })

  it('refuses to reset the project root', () => {
    expect(() =>
      assertSafeLocalStateReset({
        label: 'project root',
        targetPath: process.cwd(),
      }),
    ).toThrow('project root')
  })
})
