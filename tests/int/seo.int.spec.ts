import { describe, expect, it } from 'vitest'

import { buildArticleStructuredData, buildPageMetadata, buildSeoDescription } from '@/shared/content/seo'

describe('seo utilities', () => {
  it('builds plain text descriptions from markdown content', () => {
    const description = buildSeoDescription({
      content:
        '# Payload CMS\n\nThis is a **longer** markdown excerpt with a [link](https://example.com) and `inline code`.',
    })

    expect(description).toContain('Payload CMS')
    expect(description).toContain('longer markdown excerpt')
    expect(description).not.toContain('**')
    expect(description).not.toContain('https://example.com')
    expect(description?.length).toBeLessThanOrEqual(160)
  })

  it('builds article metadata with canonical URLs and a generated fallback share image', () => {
    const metadata = buildPageMetadata({
      canonicalLocale: 'en',
      content: 'This article explains how to set up SEO in Payload CMS with Next.js.',
      fallbackDescription: 'Default site description',
      openGraphType: 'article',
      pathname: '/posts/seo-in-payload',
      publishedTime: '2026-03-23T12:00:00.000Z',
      robots: {
        follow: true,
        index: true,
      },
      siteName: 'ZBlog',
      title: 'SEO in Payload',
    })

    expect(metadata.title).toBe('SEO in Payload | ZBlog')
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/en/posts/seo-in-payload')
    expect(metadata.twitter?.card).toBe('summary_large_image')
    expect(metadata.openGraph?.type).toBe('article')

    const images = metadata.openGraph?.images as Array<{ url: string }>

    expect(images[0]?.url).toContain('/api/og?')
  })

  it('builds article structured data with publisher and author information', () => {
    const structuredData = buildArticleStructuredData({
      authorName: 'Zenoro',
      description: 'A post about strengthening blog SEO.',
      image: {
        alt: 'SEO cover image',
        height: 630,
        url: '/media/seo-cover.png',
        width: 1200,
      },
      locale: 'en',
      modifiedAt: '2026-03-23T12:30:00.000Z',
      pathname: '/posts/seo-in-payload',
      publishedAt: '2026-03-23T12:00:00.000Z',
      siteDescription: 'A bilingual blog about tech, products, and everyday work.',
      siteName: 'ZBlog',
      title: 'SEO in Payload',
    })

    expect(structuredData['@context']).toBe('https://schema.org')
    expect(Array.isArray(structuredData['@graph'])).toBe(true)

    const graph = structuredData['@graph'] as Array<Record<string, unknown>>
    const article = graph.find((entry) => entry['@type'] === 'BlogPosting')

    expect(article?.headline).toBe('SEO in Payload')
    expect(article?.mainEntityOfPage).toBe('http://localhost:3000/en/posts/seo-in-payload')
    expect(article?.image).toEqual(['http://localhost:3000/media/seo-cover.png'])
    expect(article?.author).toEqual({
      '@type': 'Person',
      name: 'Zenoro',
    })
  })
})
