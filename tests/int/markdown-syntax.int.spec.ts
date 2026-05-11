import { describe, expect, it } from 'vitest'

import { parseArticleLabel, prepareMarkdownSource } from '@/features/article/markdown/article-syntax'

describe('markdown article syntax helpers', () => {
  it('escapes article reference colons outside fenced code blocks', () => {
    const source = `
See [@fig:overview] and [@smith2024].

\`\`\`md
Literal [@fig:overview]
\`\`\`

![System overview](/media/overview.png){#fig:overview}
`

    expect(prepareMarkdownSource(source)).toContain(`[@fig__zblog_colon__overview]`)
    expect(prepareMarkdownSource(source)).toContain(`{#fig__zblog_colon__overview}`)
    expect(prepareMarkdownSource(source)).toContain(`Literal [@fig:overview]`)
  })

  it('transforms whitelisted JSX-like blocks into markdown directives outside fenced code blocks', () => {
    const source = `
<NoticeCard tone="info" title="Rendered component">
Visible body
</NoticeCard>

<FeatureGrid items='[{"title":"Citation","status":"native"}]' />

\`\`\`tsx
<NoticeCard tone="info" title="Code only" />
\`\`\`
`

    const prepared = prepareMarkdownSource(source)

    expect(prepared).toContain(':::notice-card{')
    expect(prepared).toContain('::feature-grid{')
    expect(prepared).toContain('Visible body')
    expect(prepared).toContain('<NoticeCard tone="info" title="Code only" />')
    expect(prepared).not.toContain('<NoticeCard tone="info" title="Rendered component">')
  })

  it('parses supported article labels and rejects bibliography labels', () => {
    expect(parseArticleLabel('#fig:overview')).toEqual({
      kind: 'fig',
      label: 'fig:overview',
    })
    expect(parseArticleLabel('tbl:benchmark')).toEqual({
      kind: 'tbl',
      label: 'tbl:benchmark',
    })
    expect(parseArticleLabel('smith2024')).toBeNull()
  })
})
