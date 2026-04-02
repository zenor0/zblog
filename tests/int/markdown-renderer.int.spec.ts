import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildCitationIndex } from '@/lib/citations'
import { MarkdownRenderer } from '@/lib/markdown'

function renderMarkdown(
  source: string,
  options: {
    articleReferenceLabels?: {
      fig?: string
      tbl?: string
    }
  } = {},
) {
  return renderToStaticMarkup(
    React.createElement(MarkdownRenderer, {
      articleReferenceLabels: options.articleReferenceLabels,
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

    expect(html).toContain('<blockquote>')
    expect(html).not.toContain('md-callout')
  })

  it('renders labeled figures and figure cross-references', () => {
    const source = `
![System overview](/media/overview.png "Overall architecture"){#fig:overview}

See [@fig:overview].
`

    const html = renderMarkdown(source)

    expect(html).toContain('id="ref-fig-overview"')
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
    expect(html).toContain('href="#ref-tbl-benchmark"')
    expect(html).toContain('>Table 1<')
    expect(html).toContain('Table 1. Benchmark results')
  })

  it('keeps unresolved article references visible', () => {
    const html = renderMarkdown('Broken [@fig:missing].')

    expect(html).toContain('citation-link--missing')
    expect(html).toContain('@fig:missing')
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
    expect(html).toContain('language-tsx')
    expect(html).toContain('&lt;div&gt;Hello&lt;/div&gt;')
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
    expect(html).toContain('Rendered component')
    expect(html).toContain('This body should render inside the component.')
    expect(html).toContain('data-markdown-component="feature-grid"')
    expect(html).toContain('Figure refs')
  })
})
