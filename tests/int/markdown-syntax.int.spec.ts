import { describe, expect, it } from 'vitest'

import { parseArticleLabel, prepareMarkdownSource } from '@/lib/markdown/article-syntax'

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
