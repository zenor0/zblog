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
        slug: 'article-anchor-return',
        title: 'Article Anchor Return Lab',
        description: '对比页内锚点跳转后的返回阅读位置控件，重点验证移动端低打扰方案。',
        href: '/dev/article-anchor-return',
        status: 'experiment',
        tags: ['article', 'anchors', 'mobile', 'navigation'],
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
        slug: 'article-title-layouts',
        title: 'Article Title Layouts',
        description: '对比正式文章页标题、摘要和元信息的紧凑排版候选。',
        href: '/dev/article-title-layouts',
        status: 'experiment',
        tags: ['article', 'title', 'excerpt', 'frontmatter'],
      },
      {
        slug: 'site-shell-candidates',
        title: 'Site Shell Candidates',
        description: '收敛全站顶部导航与首页项目索引的候选排版，用于确认下一版生产实现。',
        href: '/dev/site-shell-candidates',
        status: 'experiment',
        tags: ['navigation', 'homepage', 'projects', 'layout'],
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
