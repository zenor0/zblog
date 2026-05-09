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
      {
        slug: 'article-blocks',
        title: 'Article Blocks',
        description: '静态枚举文章富文本块、插入块和白名单组件的所有预期状态。',
        href: '/dev/design-system/article-blocks',
        status: 'foundation',
        tags: ['article', 'rich-text', 'blocks', 'states'],
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
      {
        slug: 'article-layout',
        title: 'Article Layout Lab',
        description: '复用真实文章页，对比正文、标题、图片、代码块、表格和提示块的排版节奏。',
        href: '/dev/article-layout',
        status: 'experiment',
        tags: ['article', 'typography', 'layout', 'rich-text'],
      },
      {
        slug: 'footer-layouts',
        title: 'Footer Layouts',
        description: '对比更接近博客实践的 footer 信息排版：链接、版权、备案号和低频元信息。',
        href: '/dev/footer-layouts',
        status: 'experiment',
        tags: ['footer', 'compliance', 'links', 'layout'],
      },
      {
        slug: 'typefaces',
        title: 'Typeface Candidates',
        description: '横向比较中文标题、中文正文、西文混排、强调字重和代码块字体的候选方案。',
        href: '/dev/typefaces',
        status: 'experiment',
        tags: ['typography', 'cjk', 'latin', 'code'],
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
