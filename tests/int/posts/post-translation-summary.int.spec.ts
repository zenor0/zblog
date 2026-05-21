import { describe, expect, it } from 'vitest'

import {
  buildTranslationLocaleRow,
  countTranslatedFields,
} from '@/features/posts/admin/postTranslationSummary'

describe('postTranslationSummary', () => {
  it('counts translated title, excerpt, and content fields', () => {
    expect(
      countTranslatedFields({
        content: 'Body copy',
        excerpt: '',
        title: 'Hello',
      }),
    ).toBe(2)
  })

  it('builds locale row metadata for badges and completion text', () => {
    const row = buildTranslationLocaleRow({
      activeLocale: 'zh-Hans',
      locale: 'en',
      snapshot: {
        content: 'Body copy',
        excerpt: null,
        title: 'Hello',
        translatedAt: '2026-04-03T08:00:00.000Z',
        translatedFromLocale: 'zh-Hans',
        translationStatus: 'machine',
      },
    })

    expect(row.code).toBe('en')
    expect(row.label).toBe('English')
    expect(row.completedFields).toBe(2)
    expect(row.completionLabel).toBe('2/3')
    expect(row.isActive).toBe(false)
    expect(row.isDefault).toBe(false)
    expect(row.translationStatusLabel).toBe('Machine')
    expect(row.translationNote).toContain('From 简体中文')
  })
})
