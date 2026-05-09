import { describe, expect, it } from 'vitest'

import {
  extractCodeLanguageFromClassName,
  highlightCodeSnippet,
  normalizeCodeLanguage,
} from '@/lib/markdown/code-highlighting'

describe('code highlighting', () => {
  it('normalizes common fenced-code language aliases', () => {
    expect(normalizeCodeLanguage('tsx')).toBe('typescript')
    expect(normalizeCodeLanguage('js')).toBe('javascript')
    expect(normalizeCodeLanguage('shell')).toBe('bash')
    expect(normalizeCodeLanguage('yml')).toBe('yaml')
    expect(normalizeCodeLanguage('unknown-lang')).toBe('unknown-lang')
  })

  it('extracts the language from markdown code class names', () => {
    expect(extractCodeLanguageFromClassName('language-tsx')).toBe('tsx')
    expect(extractCodeLanguageFromClassName('hljs language-json')).toBe('json')
    expect(extractCodeLanguageFromClassName('not-a-language')).toBeNull()
  })

  it('highlights supported languages and escapes code text', () => {
    const result = highlightCodeSnippet('export const label = "<Badge />"', 'tsx')

    expect(result.highlighted).toBe(true)
    expect(result.language).toBe('typescript')
    expect(result.html).toContain('hljs-keyword')
    expect(result.html).toContain('&quot;&lt;Badge /&gt;&quot;')
    expect(result.html).not.toContain('<Badge />')
  })

  it('falls back to escaped plain code for unsupported languages', () => {
    const result = highlightCodeSnippet('<tag dangerous="true">', 'made-up-language')

    expect(result.highlighted).toBe(false)
    expect(result.language).toBeNull()
    expect(result.html).toBe('&lt;tag dangerous=&quot;true&quot;&gt;')
  })
})
