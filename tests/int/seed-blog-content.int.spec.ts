import { describe, expect, it } from 'vitest'

import {
  buildEnMarkdownShowcaseContent,
  buildZhMarkdownShowcaseContent,
  seedMarkdownShowcaseSlug,
} from '@/lib/seed-blog-content'

describe('seed blog content', () => {
  it('builds a markdown showcase article covering the supported syntax features', () => {
    const zhContent = buildZhMarkdownShowcaseContent('/media/seed-hero.svg')
    const enContent = buildEnMarkdownShowcaseContent('/media/seed-hero.svg')

    expect(seedMarkdownShowcaseSlug).toBe('seed-markdown-showcase')

    for (const content of [zhContent, enContent]) {
      expect(content).toContain('[@smith2024]')
      expect(content).toContain('{#fig:seed-hero}')
      expect(content).toContain('[@fig:seed-hero]')
      expect(content).toContain('{#tbl:feature-matrix}')
      expect(content).toContain('[@tbl:feature-matrix]')
      expect(content).toContain('<NoticeCard tone=')
      expect(content).toContain('<FeatureGrid items=')
      expect(content).toContain('```tsx')
      expect(content).toContain('> [!NOTE]')
      expect(content).toContain('> [!WARNING]')
      expect(content).not.toContain(':::note')
      expect(content).toContain('| Feature | Status |')
      expect(content).toContain('---')
    }
  })
})
