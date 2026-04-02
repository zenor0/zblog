import { describe, expect, it } from 'vitest'

import {
  findMarkdownComponentByDirectiveName,
  findMarkdownComponentByJsxTag,
  markdownComponentDefinitions,
  markdownComponentRenderers,
} from '@/lib/markdown/component-registry'

describe('markdown component registry', () => {
  it('resolves supported components by JSX tag and directive name', () => {
    expect(findMarkdownComponentByJsxTag('NoticeCard')).toMatchObject({
      directiveName: 'notice-card',
      jsxTag: 'NoticeCard',
    })
    expect(findMarkdownComponentByDirectiveName('feature-grid')).toMatchObject({
      directiveName: 'feature-grid',
      jsxTag: 'FeatureGrid',
    })
    expect(findMarkdownComponentByJsxTag('UnknownCard')).toBeNull()
    expect(findMarkdownComponentByDirectiveName('unknown-card')).toBeNull()
  })

  it('provides a renderer for every registered directive name', () => {
    expect(markdownComponentDefinitions.length).toBeGreaterThan(0)

    for (const definition of markdownComponentDefinitions) {
      expect(markdownComponentRenderers[definition.directiveName]).toBeTypeOf('function')
    }
  })
})
