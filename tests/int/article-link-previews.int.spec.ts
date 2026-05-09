import { describe, expect, it } from 'vitest'

import {
  buildBibliographyLinkPreviews,
  buildHeadingLinkPreviews,
  createFallbackLinkPreview,
} from '@/lib/article-link-previews'
import { parseBibliography } from '@/lib/bibliography'

describe('article link previews', () => {
  it('builds concise previews for bibliography references', () => {
    const entries = parseBibliography(`
@article{smith2024,
  author = {Smith, Ada and Chen, Lin},
  title = {Designing Blogs that Respect References},
  journaltitle = {Journal of Technical Publishing},
  year = {2024},
  doi = {10.1000/zblog.2024}
}
`)

    const previews = buildBibliographyLinkPreviews(entries, {
      referenceItem: 'reference',
      referenceUntitled: 'Untitled work',
    })

    expect(previews.byKey.smith2024).toMatchObject({
      description: 'Journal of Technical Publishing',
      href: '#reference-1',
      kind: 'bibliography',
      meta: 'Reference [1] · article',
      subtitle: 'Ada Smith, Lin Chen · 2024',
      title: 'Designing Blogs that Respect References',
    })
    expect(previews.byHref['#reference-1']).toEqual(previews.byKey.smith2024)
  })

  it('builds previews for heading anchors', () => {
    const previews = buildHeadingLinkPreviews([
      {
        depth: 2,
        displayNumber: '1',
        id: 'methods',
        text: 'Methods',
      },
    ])

    expect(previews['#methods']).toEqual({
      description: undefined,
      href: '#methods',
      kind: 'heading',
      meta: 'Heading H2 · 1',
      subtitle: 'Article section',
      title: 'Methods',
    })
  })

  it('creates safe fallback previews for external and internal links', () => {
    expect(createFallbackLinkPreview('https://payloadcms.com/docs', 'Payload docs')).toEqual({
      description: 'https://payloadcms.com/docs',
      href: 'https://payloadcms.com/docs',
      kind: 'external',
      meta: 'External link',
      subtitle: 'payloadcms.com',
      title: 'Payload docs',
    })

    expect(createFallbackLinkPreview('#unknown-section', 'jump')).toEqual({
      description: '#unknown-section',
      href: '#unknown-section',
      kind: 'internal',
      meta: 'Internal link',
      subtitle: 'Article anchor',
      title: 'jump',
    })
  })
})
