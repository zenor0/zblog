import lint from '@commitlint/lint'
import type { QualifiedRules } from '@commitlint/types'
import { describe, expect, it } from 'vitest'

import commitlintConfig from '../../commitlint.config.mjs'

const rules = commitlintConfig.rules as QualifiedRules

async function lintCommitMessage(message: string) {
  return lint(message, rules)
}

describe('commit message policy', () => {
  it('accepts conventional commit messages with or without scopes', async () => {
    await expect(lintCommitMessage('feat(posts): add draft preview')).resolves.toMatchObject({
      valid: true,
    })
    await expect(lintCommitMessage('fix: handle empty article title')).resolves.toMatchObject({
      valid: true,
    })
    await expect(lintCommitMessage('docs(agent): 记录提交规范')).resolves.toMatchObject({
      valid: true,
    })
  })

  it('rejects vague or unsupported commit messages', async () => {
    await expect(lintCommitMessage('update stuff')).resolves.toMatchObject({
      valid: false,
    })
    await expect(lintCommitMessage('misc: change files')).resolves.toMatchObject({
      valid: false,
    })
  })

  it('rejects invalid scopes and overlong headers', async () => {
    await expect(lintCommitMessage('feat(PostEditor): add preview')).resolves.toMatchObject({
      valid: false,
    })
    await expect(lintCommitMessage(`fix: ${'x'.repeat(96)}`)).resolves.toMatchObject({
      valid: false,
    })
  })
})
