import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { buildCitationIndex } from '@/lib/citations'
import { MarkdownRenderer } from '@/lib/markdown'

function renderMarkdown(source: string) {
  return renderToStaticMarkup(
    React.createElement(MarkdownRenderer, {
      citationIndex: buildCitationIndex(source),
      source,
    }),
  )
}

describe('markdown renderer', () => {
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
})
