import { describe, expect, it } from 'vitest'

import {
  defaultArticleProgressMapConfig,
  defaultArticleTocVariantID,
  frontendVariantRegistry,
  getDefaultFrontendVariantLookup,
  getFrontendVariantOverride,
  normalizeFrontendVariantSettings,
  parseFrontendVariantConfigYAML,
  resolveFrontendVariant,
  resolveFrontendVariantConfig,
  resolveFrontendVariantLookup,
  resolveFrontendVariantSelection,
  resolveFrontendVariantValues,
  serializeFrontendVariantConfigToYAML,
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
      'article.toc': {
        configs: {
          'progress-map': defaultArticleProgressMapConfig,
          standard: {},
        },
        variant: 'standard',
      },
    })
  })

  it('resolves missing or invalid lookup variants to the surface default', () => {
    expect(resolveFrontendVariant('article.toc', null)).toBe('standard')
    expect(
      resolveFrontendVariant('article.toc', {
        values: { 'article.toc': 'not-real' },
      }),
    ).toBe('standard')
    expect(resolveFrontendVariantLookup({ values: {} })['article.toc'].variant).toBe('standard')
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
      'article.toc': {
        configs: {
          'progress-map': defaultArticleProgressMapConfig,
          standard: {},
        },
        variant: 'progress-map',
      },
    })
  })

  it('can read legacy selections and legacy string lookup values', () => {
    expect(
      resolveFrontendVariant('article.toc', {
        selections: [{ surface: 'article.toc', variant: 'progress-map' }],
      }),
    ).toBe('progress-map')
    expect(
      resolveFrontendVariantSelection('article.toc', {
        values: { 'article.toc': 'progress-map' },
      }),
    ).toEqual({
      config: defaultArticleProgressMapConfig,
      variant: 'progress-map',
    })
  })

  it('resolves structured variant config with defaults for missing fields', () => {
    expect(
      resolveFrontendVariantConfig('article.toc', {
        values: {
          'article.toc': {
            configs: {
              'progress-map': {
                bendScale: 0.82,
                lineWeight: 'strong',
                pathStyle: 'flow',
                visibleHeadingLevels: [2, 3],
              },
            },
            variant: 'progress-map',
          },
        },
      }),
    ).toEqual({
      ...defaultArticleProgressMapConfig,
      bendScale: 0.82,
      lineWeight: 'strong',
      pathStyle: 'flow',
      visibleHeadingLevels: [2, 3],
    })
  })

  it('normalizes settings to the structured lookup while preserving inactive variant configs', () => {
    expect(
      normalizeFrontendVariantSettings({
        values: {
          'article.toc': {
            configs: {
              'progress-map': {
                pathStyle: 'flow',
              },
            },
            variant: 'standard',
          },
        },
      }),
    ).toMatchObject({
      values: {
        'article.toc': {
          configs: {
            'progress-map': {
              pathStyle: 'flow',
            },
            standard: {},
          },
          variant: 'standard',
        },
      },
    })
  })

  it('lets valid query overrides win without making invalid overrides destructive', () => {
    const configured = {
      values: {
        'article.toc': {
          configs: {
            'progress-map': { pathStyle: 'flow' },
          },
          variant: 'progress-map',
        },
      },
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
      resolveFrontendVariantSelection('article.toc', configured, {
        'variant.article.toc': 'standard',
      }),
    ).toEqual({
      config: {},
      variant: 'standard',
    })
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

  it('rejects invalid structured config before saving', () => {
    expect(() =>
      validateFrontendVariantSettings({
        values: {
          'article.toc': {
            configs: {
              'progress-map': {
                unknownSetting: true,
              },
            },
            variant: 'progress-map',
          },
        },
      }),
    ).toThrow(/unknownSetting is not allowed/)
    expect(() =>
      validateFrontendVariantSettings({
        values: {
          'article.toc': {
            configs: {
              'progress-map': {
                pathStyle: 'zigzag',
              },
            },
            variant: 'progress-map',
          },
        },
      }),
    ).toThrow(/pathStyle/)
    expect(() =>
      validateFrontendVariantSettings({
        values: {
          'article.toc': {
            configs: {
              'progress-map': {
                bendScale: 1.2,
              },
            },
            variant: 'progress-map',
          },
        },
      }),
    ).toThrow(/bendScale/)
    expect(() =>
      validateFrontendVariantSettings({
        values: {
          'article.toc': {
            configs: {
              'progress-map': {
                visibleHeadingLevels: [],
              },
            },
            variant: 'progress-map',
          },
        },
      }),
    ).toThrow(/visibleHeadingLevels/)
  })

  it('round-trips active variant config YAML through the schema', () => {
    const yaml = serializeFrontendVariantConfigToYAML('article.toc', 'progress-map', {
      ...defaultArticleProgressMapConfig,
      lineWeight: 'strong',
      pathStyle: 'flow',
    })

    expect(yaml).toContain('pathStyle: flow')
    expect(yaml).toContain('lineWeight: strong')
    expect(parseFrontendVariantConfigYAML('article.toc', 'progress-map', yaml)).toMatchObject({
      lineWeight: 'strong',
      pathStyle: 'flow',
    })
    expect(() =>
      parseFrontendVariantConfigYAML('article.toc', 'progress-map', 'pathStyle: zigzag'),
    ).toThrow(/pathStyle/)
  })
})
