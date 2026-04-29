export type DevReferenceStatus = 'foundation' | 'experiment' | 'draft'

export type DevReferenceItem = {
  slug: string
  title: string
  description: string
  href: string
  status: DevReferenceStatus
  tags: string[]
}

export type DevReferenceSection = {
  id: string
  title: string
  description: string
  items: DevReferenceItem[]
}

export const devReferenceSections: DevReferenceSection[] = [
  {
    id: 'foundation',
    title: '设计基线',
    description: '定义博客前台的视觉语言、排版节奏、交互控件和页面构成原则。',
    items: [
      {
        slug: 'design-system',
        title: 'Design System',
        description: '前台设计语言、色彩语义、字体层级、布局规则、组件状态与动效原则。',
        href: '/dev/design-system',
        status: 'foundation',
        tags: ['tokens', 'typography', 'components', 'motion'],
      },
    ],
  },
  {
    id: 'experiments',
    title: '组件实验室',
    description: '隔离开发尚未定型的前台组件，验证交互、布局和内容边界。',
    items: [
      {
        slug: 'article-progress',
        title: 'Article Progress Lab',
        description: '文章阅读进度、章节目录、当前位置提示和长文浏览辅助控件的沙盒。',
        href: '/dev/article-progress',
        status: 'experiment',
        tags: ['article', 'toc', 'progress', 'reading'],
      },
    ],
  },
]

export function getDevReferenceItems() {
  return devReferenceSections.flatMap((section) => section.items)
}

export function getDevReferenceItem(slug: string) {
  return getDevReferenceItems().find((item) => item.slug === slug) ?? null
}
