import { describe, expect, it } from 'vitest'

import {
  buildLocalePath,
  defaultLocale,
  getLocaleLabel,
  getLocaleSlug,
  matchPreferredLocale,
  normalizeLocale,
  parseAcceptLanguageHeader,
} from '@/lib/locales'

describe('locale utilities', () => {
  it('normalizes canonical and legacy locale inputs', () => {
    expect(normalizeLocale('zh-Hans')).toBe('zh-Hans')
    expect(normalizeLocale('zh-hans')).toBe('zh-Hans')
    expect(normalizeLocale('zh')).toBe('zh-Hans')
    expect(normalizeLocale('zh-CN')).toBe('zh-Hans')
    expect(normalizeLocale('zh-TW')).toBeNull()
    expect(normalizeLocale('EN')).toBe('en')
    expect(normalizeLocale('en-US')).toBe('en')
    expect(normalizeLocale('fr-CA')).toBeNull()
  })

  it('builds lowercase locale paths from canonical locale tags', () => {
    expect(getLocaleSlug('zh-Hans')).toBe('zh-hans')
    expect(getLocaleSlug('zh-CN')).toBe('zh-hans')
    expect(getLocaleSlug('en-US')).toBe('en')
    expect(buildLocalePath(defaultLocale)).toBe('/zh-hans')
    expect(buildLocalePath('zh-CN', '/posts/demo')).toBe('/zh-hans/posts/demo')
    expect(buildLocalePath('en-US', '/posts/demo')).toBe('/en/posts/demo')
  })

  it('keeps friendly labels and matches Accept-Language preferences', () => {
    expect(getLocaleLabel('zh-Hans')).toBe('简体中文')
    expect(getLocaleLabel('zh')).toBe('简体中文')
    expect(getLocaleLabel('en')).toBe('English')
    expect(getLocaleLabel('en-US')).toBe('English')

    const parsedHeader = parseAcceptLanguageHeader('en-US,en;q=0.9,zh;q=0.8')

    expect(parsedHeader).toEqual(['en-US', 'en', 'zh'])
    expect(matchPreferredLocale(parsedHeader)).toBe('en')
    expect(matchPreferredLocale(['zh-CN', 'en-US'])).toBe('zh-Hans')
    expect(matchPreferredLocale(['zh-TW', 'en-US'])).toBe('en')
    expect(matchPreferredLocale(['zh-TW'])).toBe(defaultLocale)
  })
})
