import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildCitationIndex } from '@/features/article/model/citations'
import { MarkdownRenderer } from '@/features/article/markdown'
import { buildBibliographyLinkPreviews } from '@/features/article/model/article-link-previews'
import { parseBibliography } from '@/features/article/model/bibliography'

function renderMarkdown(
  source: string,
  options: {
    articleReferenceLabels?: {
      fig?: string
      tbl?: string
    }
    bibliographyPreviewsByKey?: Record<string, any>
  } = {},
) {
  return renderToStaticMarkup(
    React.createElement(MarkdownRenderer, {
      articleReferenceLabels: options.articleReferenceLabels,
      bibliographyPreviewsByKey: options.bibliographyPreviewsByKey,
      citationIndex: buildCitationIndex(source),
      source,
    }),
  )
}

describe('markdown renderer', () => {
  it('renders GitHub note callouts and removes the marker from the body', () => {
    const html = renderMarkdown(`
> [!NOTE]
> This content should render as a note callout.
`)

    expect(html).toContain('md-callout--note')
    expect(html).toContain('data-article-block="callout"')
    expect(html).toContain('data-callout-label="Note"')
    expect(html).toContain('This content should render as a note callout.')
    expect(html).not.toContain('[!NOTE]')
  })

  it('matches GitHub callout labels case-insensitively and preserves multiple paragraphs', () => {
    const html = renderMarkdown(`
> [!warning]
> First paragraph.
>
> Second paragraph.
`)

    expect(html).toContain('md-callout--warning')
    expect(html).toContain('data-callout-label="Warning"')
    expect(html).toContain('First paragraph.')
    expect(html).toContain('Second paragraph.')
  })

  it('renders unknown GitHub callout labels with fallback styling', () => {
    const html = renderMarkdown(`
> [!research notes]
> Custom labels should still render as callouts.
`)

    expect(html).toContain('md-callout--custom')
    expect(html).toContain('data-callout-label="Research Notes"')
    expect(html).toContain('Custom labels should still render as callouts.')
  })

  it('keeps ordinary blockquotes as blockquotes', () => {
    const html = renderMarkdown(`
> This is just a quote.
`)

    expect(html).toMatch(/<blockquote[^>]*data-article-block="blockquote"[^>]*>/)
    expect(html).toContain('data-article-block="blockquote"')
    expect(html).not.toContain('md-callout')
  })

  it('renders labeled figures and figure cross-references', () => {
    const source = `
![System overview](/media/overview.png "Overall architecture"){#fig:overview}

See [@fig:overview].
`

    const html = renderMarkdown(source)

    expect(html).toContain('id="ref-fig-overview"')
    expect(html).toContain('data-article-block="figure"')
    expect(html).toContain('href="#ref-fig-overview"')
    expect(html).toContain('>Figure 1<')
    expect(html).toContain('Figure 1. Overall architecture')
  })

  it('localizes figure and table labels when label overrides are provided', () => {
    const source = `
![System overview](/media/overview.png "Overall architecture"){#fig:overview}

| Column | Value |
| --- | --- |
| A | 1 |

: 基准结果 {#tbl:benchmark}

See [@fig:overview] and [@tbl:benchmark].
`

    const html = renderMarkdown(source, {
      articleReferenceLabels: {
        fig: '图',
        tbl: '表',
      },
    })

    expect(html).toContain('>图 1<')
    expect(html).toContain('图 1. Overall architecture')
    expect(html).toContain('>表 1<')
    expect(html).toContain('表 1. 基准结果')
  })

  it('renders table captions, anchors, and table cross-references', () => {
    const source = `
| Column | Value |
| --- | --- |
| A | 1 |
| B | 2 |

: Benchmark results {#tbl:benchmark}

See [@tbl:benchmark].
`

    const html = renderMarkdown(source)

    expect(html).toContain('id="ref-tbl-benchmark"')
    expect(html).toContain('data-article-block="table"')
    expect(html).toContain('href="#ref-tbl-benchmark"')
    expect(html).toContain('>Table 1<')
    expect(html).toContain('Table 1. Benchmark results')
  })

  it('keeps unresolved article references visible', () => {
    const html = renderMarkdown('Broken [@fig:missing].')

    expect(html).toContain('citation-link--missing')
    expect(html).toContain('@fig:missing')
  })

  it('adds preview metadata to citation, article reference, heading, and external links', () => {
    const source = `
## Overview

![System overview](/media/overview.png "Overall architecture"){#fig:overview}

See [@smith2024], [@fig:overview], [Overview](#overview), and [Payload](https://payloadcms.com/docs).
`
    const bibliographyPreviews = buildBibliographyLinkPreviews(
      parseBibliography(`
@article{smith2024,
  author = {Smith, Ada},
  title = {Designing Blogs that Respect References},
  journaltitle = {Journal of Technical Publishing},
  year = {2024}
}
`),
      {
        referenceItem: 'reference',
        referenceUntitled: 'Untitled work',
      },
    )
    const html = renderMarkdown(source, {
      bibliographyPreviewsByKey: bibliographyPreviews.byKey,
    })

    expect(html).toContain('data-link-preview-kind="bibliography"')
    expect(html).toContain('data-article-block="citation-link"')
    expect(html).toContain('data-link-preview-title="Designing Blogs that Respect References"')
    expect(html).toContain('data-link-preview-kind="articleElement"')
    expect(html).toContain('data-link-preview-title="Figure 1"')
    expect(html).toContain('data-link-preview-kind="heading"')
    expect(html).toContain('data-link-preview-title="Overview"')
    expect(html).toContain('data-link-preview-kind="external"')
    expect(html).toContain('data-link-preview-subtitle="payloadcms.com"')
  })

  it('renders article heading numbers as metadata without changing heading text', () => {
    const html = renderMarkdown(`
# Body title

## First section

### Nested section

#### Deep section

##### Unnumbered section
`)

    expect(html).toMatch(
      /<h2(?=[^>]*id="first-section")(?=[^>]*data-article-heading="true")(?=[^>]*data-article-heading-level="2")(?=[^>]*data-article-heading-number="1")[^>]*>First section<\/h2>/,
    )
    expect(html).toContain('data-article-block="heading"')
    expect(html).toMatch(
      /<h3(?=[^>]*id="nested-section")(?=[^>]*data-article-heading="true")(?=[^>]*data-article-heading-level="3")(?=[^>]*data-article-heading-number="1\.1")[^>]*>Nested section<\/h3>/,
    )
    expect(html).toMatch(
      /<h4(?=[^>]*id="deep-section")(?=[^>]*data-article-heading="true")(?=[^>]*data-article-heading-level="4")(?=[^>]*data-article-heading-number="1\.1\.1")[^>]*>Deep section<\/h4>/,
    )
    expect(html).toMatch(
      /<h1(?=[^>]*id="body-title")(?=[^>]*data-article-block="heading")[^>]*>Body title<\/h1>/,
    )
    expect(html).toMatch(
      /<h5(?=[^>]*id="unnumbered-section")(?=[^>]*data-article-block="heading")[^>]*>Unnumbered section<\/h5>/,
    )
    expect(html).not.toContain('>1 First section<')
  })

  it('marks common structural blocks for article design tokens', () => {
    const html = renderMarkdown(`
- First item
- Second item

---
`)

    expect(html).toMatch(/<ul(?=[^>]*data-article-block="list")[^>]*>/)
    expect(html).toMatch(/<hr(?=[^>]*data-article-block="divider")[^>]*\/>/)
  })

  it('preserves fenced tsx code blocks with a visible language label', () => {
    const source = `
\`\`\`tsx
export function Demo() {
  return <div>Hello</div>
}
\`\`\`
`

    const html = renderMarkdown(source)

    expect(html).toContain('data-language="tsx"')
    expect(html).toContain('data-article-block="code-block"')
    expect(html).toContain('data-highlighted="true"')
    expect(html).toContain('data-highlight-language="typescript"')
    expect(html).toContain('language-tsx')
    expect(html).toContain('hljs-keyword')
    expect(html).toContain('&lt;')
    expect(html).toContain('Hello')
    expect(html).not.toContain('<div>Hello</div>')
  })

  it('renders whitelisted JSX-like markdown components', () => {
    const source = `
<NoticeCard tone="info" title="Rendered component">
This body should render inside the component.
</NoticeCard>

<FeatureGrid items='[{"title":"Citation","status":"native"},{"title":"Figure refs","status":"native"}]' />
`

    const html = renderMarkdown(source)

    expect(html).toContain('data-markdown-component="notice-card"')
    expect(html).toContain('data-article-block="notice-card"')
    expect(html).toContain('Rendered component')
    expect(html).toContain('This body should render inside the component.')
    expect(html).toContain('data-markdown-component="feature-grid"')
    expect(html).toContain('data-article-block="feature-grid"')
    expect(html).toContain('Figure refs')
  })
})
