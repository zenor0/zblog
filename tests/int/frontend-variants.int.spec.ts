import { describe, expect, it } from 'vitest'

import {
  defaultArticleTocVariantID,
  frontendVariantRegistry,
  getDefaultFrontendVariantLookup,
  getFrontendVariantOverride,
  resolveFrontendVariant,
  resolveFrontendVariantLookup,
  resolveFrontendVariantValues,
  validateFrontendVariantSettings,
} from '@/features/frontend-variants/model/frontend-variants'

describe('frontend variants', () => {
  it('registers article table-of-contents variants with a stable default', () => {
    expect(defaultArticleTocVariantID).toBe('standard')
    expect(frontendVariantRegistry['article.toc'].variants.map((variant) => variant.id)).toEqual([
      'standard',
      'progress-map',
    ])
  })

  it('builds a complete default lookup from the registered surfaces', () => {
    expect(getDefaultFrontendVariantLookup()).toEqual({
      'article.toc': 'standard',
    })
  })

  it('resolves missing or invalid lookup values to the surface default', () => {
    expect(resolveFrontendVariant('article.toc', null)).toBe('standard')
    expect(
      resolveFrontendVariant('article.toc', {
        values: { 'article.toc': 'not-real' },
      }),
    ).toBe('standard')
    expect(resolveFrontendVariantLookup({ values: {} })).toEqual({
      'article.toc': 'standard',
    })
  })

  it('resolves configured lookup values and ignores unknown surfaces while reading', () => {
    expect(
      resolveFrontendVariantValues({
        values: {
          'article.toc': 'progress-map',
          'unknown.surface': 'anything',
        },
      }),
    ).toEqual({
      'article.toc': 'progress-map',
    })
  })

  it('can read legacy selections when no lookup values have been saved yet', () => {
    expect(
      resolveFrontendVariant('article.toc', {
        selections: [{ surface: 'article.toc', variant: 'progress-map' }],
      }),
    ).toBe('progress-map')
  })

  it('lets valid query overrides win without making invalid overrides destructive', () => {
    const configured = {
      values: { 'article.toc': 'progress-map' },
    }

    expect(
      getFrontendVariantOverride('article.toc', {
        'variant.article.toc': 'standard',
      }),
    ).toBe('standard')
    expect(
      resolveFrontendVariant('article.toc', configured, {
        'variant.article.toc': 'standard',
      }),
    ).toBe('standard')
    expect(
      resolveFrontendVariant('article.toc', configured, {
        'variant.article.toc': 'not-real',
      }),
    ).toBe('progress-map')
  })

  it('rejects unknown lookup surfaces and variants before saving', () => {
    expect(() =>
      validateFrontendVariantSettings({
        values: { 'unknown.surface': 'progress-map' },
      }),
    ).toThrow(/Unknown frontend variant surface/)
    expect(() =>
      validateFrontendVariantSettings({
        values: { 'article.toc': 'not-real' },
      }),
    ).toThrow(/Unknown frontend variant "not-real" for article\.toc/)
  })
})
