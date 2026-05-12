import { describe, expect, it } from 'vitest'

import {
  defaultArticleTocVariantID,
  frontendVariantRegistry,
  getFrontendVariantOverride,
  resolveFrontendVariant,
  resolveFrontendVariantSelections,
} from '@/features/frontend-variants/model/frontend-variants'

describe('frontend variants', () => {
  it('registers article table-of-contents variants with a stable default', () => {
    expect(defaultArticleTocVariantID).toBe('standard')
    expect(frontendVariantRegistry['article.toc'].variants.map((variant) => variant.id)).toEqual([
      'standard',
      'progress-map',
    ])
  })

  it('resolves missing or invalid settings to the surface default', () => {
    expect(resolveFrontendVariant('article.toc', null)).toBe('standard')
    expect(
      resolveFrontendVariant('article.toc', {
        selections: [{ surface: 'article.toc', variant: 'not-real' }],
      }),
    ).toBe('standard')
  })

  it('resolves configured selections and ignores unknown surfaces', () => {
    expect(
      resolveFrontendVariantSelections({
        selections: [
          { surface: 'unknown.surface', variant: 'anything' },
          { surface: 'article.toc', variant: 'progress-map' },
        ],
      }),
    ).toEqual({
      'article.toc': 'progress-map',
    })
  })

  it('lets valid query overrides win without making invalid overrides destructive', () => {
    const configured = {
      selections: [{ surface: 'article.toc', variant: 'progress-map' }],
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
})
