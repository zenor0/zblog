import { describe, expect, it } from 'vitest'

import {
  buildContentAssetSummary,
  buildPublishingSnapshot,
  getLocaleCoverage,
  summarizeLocaleCoverage,
} from '@/components/payload/postOverviewSummary'

describe('post overview summary helpers', () => {
  it('classifies locale coverage and seo readiness using frontend fallbacks', () => {
    const snapshot = buildPublishingSnapshot({
      activeLocale: 'en',
      content: '# Payload overview\n\nBody copy used for generated metadata.',
      excerpt: 'Short excerpt',
      heroImage: {
        alt: 'Hero image',
        url: '/media/hero.png',
      },
      seo: {
        metaDescription: null,
        metaImage: null,
        metaTitle: null,
        noindex: false,
      },
      slug: 'payload-overview',
      status: 'draft',
      title: 'Payload Overview',
      translationStatus: 'machine',
      updatedAt: '2026-04-02T08:30:00.000Z',
    })

    expect(snapshot.status.value).toBe('Draft')
    expect(snapshot.content.value).toBe('Complete 2/2')
    expect(snapshot.content.tone).toBe('success')
    expect(snapshot.translation.value).toBe('Machine')
    expect(snapshot.seo.value).toBe('Ready')
    expect(snapshot.seo.tone).toBe('success')
    expect(snapshot.slug.value).toBe('payload-overview')
    expect(snapshot.noindex.value).toBe('Indexable')
  })

  it('marks missing data and noindex distinctly', () => {
    const snapshot = buildPublishingSnapshot({
      activeLocale: 'en',
      content: null,
      excerpt: null,
      heroImage: null,
      seo: {
        metaDescription: null,
        metaImage: null,
        metaTitle: null,
        noindex: true,
      },
      slug: '',
      status: 'published',
      title: 'Title only',
      translationStatus: null,
      updatedAt: null,
    })

    expect(getLocaleCoverage({ title: 'Title only', content: null })).toBe('partial')
    expect(snapshot.content.value).toBe('Partial 1/2')
    expect(snapshot.content.tone).toBe('warning')
    expect(snapshot.seo.value).toBe('Incomplete')
    expect(snapshot.seo.tone).toBe('warning')
    expect(snapshot.slug.value).toBe('Missing')
    expect(snapshot.noindex.value).toBe('Noindex')
    expect(snapshot.noindex.tone).toBe('warning')
  })

  it('summarizes locale counts and content assets', () => {
    const coverage = summarizeLocaleCoverage([
      {
        code: 'zh-Hans',
        coverage: 'complete',
        label: '简体中文',
        snapshot: {
          content: '正文',
          title: '你好',
          translatedAt: null,
          translatedFromLocale: null,
          translationStatus: 'original',
        },
      },
      {
        code: 'en',
        coverage: 'partial',
        label: 'English',
        snapshot: {
          content: null,
          title: 'Hello',
          translatedAt: '2026-04-02T09:00:00.000Z',
          translatedFromLocale: 'zh-Hans',
          translationStatus: 'machine',
        },
      },
    ])

    expect(coverage).toEqual({
      completeCount: 1,
      missingCount: 0,
      partialCount: 1,
      reviewedCount: 0,
    })

    expect(
      buildContentAssetSummary({
        attachments: [{ file: 1 }, { file: 2 }],
        bibliographyFile: {
          id: 1,
          title: 'Main bibliography',
        } as any,
        heroImage: {
          alt: 'Hero image',
          url: '/media/hero.png',
        } as any,
        tags: [{ value: 'payload' }, { value: 'cms' }],
      }),
    ).toMatchObject({
      attachmentCount: 2,
      bibliographyLabel: 'Main bibliography',
      hasHeroImage: true,
      tagCount: 2,
    })
  })
})
