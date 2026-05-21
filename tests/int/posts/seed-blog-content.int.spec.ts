import { describe, expect, it } from 'vitest'

import {
  buildEnCitationDemoContent,
  buildEnMarkdownShowcaseContent,
  buildZhCitationDemoContent,
  seedCitationDemoCopy,
  seedFallbackDemoCopy,
  buildZhMarkdownShowcaseContent,
  seedMarkdownShowcaseCopy,
  seedMarkdownShowcaseSlug,
} from '@/features/posts/seed/seed-blog-content'

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
      expect(content).toContain('> [!TIP]')
      expect(content).toContain('> [!IMPORTANT]')
      expect(content).toContain('> [!WARNING]')
      expect(content).toContain('> [!CAUTION]')
      expect(content).toContain('> [!research notes]')
      expect(content).not.toContain(':::note')
      expect(content).toContain('| Feature | Status |')
      expect(content).toContain('---')
    }
  })

  it('defines complete localized seed copy except for the dedicated fallback demo', () => {
    expect(seedCitationDemoCopy['zh-Hans'].title).toBe('带引用与版本历史的示例文章')
    expect(seedCitationDemoCopy['zh-Hans'].excerpt).toContain('引用')
    expect(seedCitationDemoCopy.en.title).toBe('Seed Post with Citations and Version History')
    expect(seedCitationDemoCopy.en.excerpt).toContain('locale switching')

    expect(seedMarkdownShowcaseCopy['zh-Hans'].title).toBe('Markdown 能力展示文章')
    expect(seedMarkdownShowcaseCopy.en.title).toBe('Markdown Feature Showcase')

    expect(Object.keys(seedFallbackDemoCopy)).toEqual(['zh-Hans'])
    expect(seedFallbackDemoCopy['zh-Hans'].excerpt).toContain('语言回退')

    expect(buildZhCitationDemoContent('/media/seed-hero.svg')).toContain('为什么博客需要显式引用')
    expect(buildEnCitationDemoContent('/media/seed-hero.svg')).toContain(
      'Why a blog should keep explicit citations',
    )
  })
})
