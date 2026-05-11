export type ArticleBlockPreviewCategorySlug =
  | 'callouts'
  | 'components'
  | 'media'
  | 'tables'
  | 'text'

export type ArticleBlockPreviewCategory = {
  description: string
  href: string
  slug: ArticleBlockPreviewCategorySlug
  title: string
}

export type ArticleBlockPreviewItem = {
  category: ArticleBlockPreviewCategorySlug
  description: string
  href: string
  id: string
  title: string
}

const articleBlockPreviewBaseHref = '/dev/design-system/article-blocks'

export const articleBlockPreviewCategories: ArticleBlockPreviewCategory[] = [
  {
    description: '标题、段落、链接、列表、引用、代码和引用链接的基础阅读状态。',
    href: `${articleBlockPreviewBaseHref}/text`,
    slug: 'text',
    title: 'Text & Flow',
  },
  {
    description: 'GitHub 风格 callout 的所有内置语义，以及自定义 label fallback。',
    href: `${articleBlockPreviewBaseHref}/callouts`,
    slug: 'callouts',
    title: 'Callouts',
  },
  {
    description: '图片、带 caption 的 figure、PDF 和未知文件 fallback 的媒体块状态。',
    href: `${articleBlockPreviewBaseHref}/media`,
    slug: 'media',
    title: 'Media',
  },
  {
    description: '普通表格、横向滚动表格、caption 表格和密集数据状态。',
    href: `${articleBlockPreviewBaseHref}/tables`,
    slug: 'tables',
    title: 'Tables',
  },
  {
    description: '文章内白名单组件的静态状态，例如 NoticeCard 和 FeatureGrid。',
    href: `${articleBlockPreviewBaseHref}/components`,
    slug: 'components',
    title: 'Components',
  },
]

export const articleBlockPreviewItems: ArticleBlockPreviewItem[] = [
  {
    category: 'text',
    description: 'H2/H3/H4 与正文之间的节奏关系。',
    href: `${articleBlockPreviewBaseHref}/text#heading-scale`,
    id: 'heading-scale',
    title: 'Heading Scale',
  },
  {
    category: 'text',
    description: '普通段落、强调、链接和 inline code 的组合。',
    href: `${articleBlockPreviewBaseHref}/text#paragraph-inline`,
    id: 'paragraph-inline',
    title: 'Paragraph & Inline Marks',
  },
  {
    category: 'text',
    description: '无序列表、有序列表和嵌套信息密度。',
    href: `${articleBlockPreviewBaseHref}/text#lists`,
    id: 'lists',
    title: 'Lists',
  },
  {
    category: 'text',
    description: '普通引用块，不带 callout 语义。',
    href: `${articleBlockPreviewBaseHref}/text#blockquote`,
    id: 'blockquote',
    title: 'Blockquote',
  },
  {
    category: 'text',
    description: '带语言标签的 fenced code block。',
    href: `${articleBlockPreviewBaseHref}/text#code-block`,
    id: 'code-block',
    title: 'Code Block',
  },
  {
    category: 'text',
    description: '解析成功和缺失状态的文内引用链接。',
    href: `${articleBlockPreviewBaseHref}/text#citation-links`,
    id: 'citation-links',
    title: 'Citation Links',
  },
  {
    category: 'callouts',
    description: 'NOTE callout，用于背景信息。',
    href: `${articleBlockPreviewBaseHref}/callouts#callout-note`,
    id: 'callout-note',
    title: 'Note Callout',
  },
  {
    category: 'callouts',
    description: 'TIP callout，用于建议和技巧。',
    href: `${articleBlockPreviewBaseHref}/callouts#callout-tip`,
    id: 'callout-tip',
    title: 'Tip Callout',
  },
  {
    category: 'callouts',
    description: 'IMPORTANT callout，用于关键约束。',
    href: `${articleBlockPreviewBaseHref}/callouts#callout-important`,
    id: 'callout-important',
    title: 'Important Callout',
  },
  {
    category: 'callouts',
    description: 'WARNING callout，用于风险提示。',
    href: `${articleBlockPreviewBaseHref}/callouts#callout-warning`,
    id: 'callout-warning',
    title: 'Warning Callout',
  },
  {
    category: 'callouts',
    description: 'CAUTION callout，用于不可逆或高风险操作。',
    href: `${articleBlockPreviewBaseHref}/callouts#callout-caution`,
    id: 'callout-caution',
    title: 'Caution Callout',
  },
  {
    category: 'callouts',
    description: '未知 label 的 fallback callout。',
    href: `${articleBlockPreviewBaseHref}/callouts#callout-custom`,
    id: 'callout-custom',
    title: 'Custom Callout',
  },
  {
    category: 'media',
    description: '正文中的独立图片块。',
    href: `${articleBlockPreviewBaseHref}/media#inline-image`,
    id: 'inline-image',
    title: 'Inline Image',
  },
  {
    category: 'media',
    description: '带编号和 caption 的图片 figure。',
    href: `${articleBlockPreviewBaseHref}/media#figure-caption`,
    id: 'figure-caption',
    title: 'Figure With Caption',
  },
  {
    category: 'media',
    description: 'PDF 预览和文件类型 badge。',
    href: `${articleBlockPreviewBaseHref}/media#pdf-preview`,
    id: 'pdf-preview',
    title: 'PDF Preview',
  },
  {
    category: 'media',
    description: '未知文件类型 fallback。',
    href: `${articleBlockPreviewBaseHref}/media#unknown-file`,
    id: 'unknown-file',
    title: 'Unknown File',
  },
  {
    category: 'tables',
    description: '基础 GFM 表格。',
    href: `${articleBlockPreviewBaseHref}/tables#basic-table`,
    id: 'basic-table',
    title: 'Basic Table',
  },
  {
    category: 'tables',
    description: '带编号、锚点和 caption 的表格。',
    href: `${articleBlockPreviewBaseHref}/tables#captioned-table`,
    id: 'captioned-table',
    title: 'Captioned Table',
  },
  {
    category: 'tables',
    description: '列较多时的横向滚动状态。',
    href: `${articleBlockPreviewBaseHref}/tables#wide-table`,
    id: 'wide-table',
    title: 'Wide Table',
  },
  {
    category: 'components',
    description: '文章内提示卡片组件。',
    href: `${articleBlockPreviewBaseHref}/components#notice-card`,
    id: 'notice-card',
    title: 'NoticeCard',
  },
  {
    category: 'components',
    description: '文章内功能网格组件。',
    href: `${articleBlockPreviewBaseHref}/components#feature-grid`,
    id: 'feature-grid',
    title: 'FeatureGrid',
  },
]

export function getArticleBlockPreviewCategory(slug: string) {
  return articleBlockPreviewCategories.find((category) => category.slug === slug) ?? null
}

export function getArticleBlockPreviewItems(category?: ArticleBlockPreviewCategorySlug) {
  if (!category) {
    return articleBlockPreviewItems
  }

  return articleBlockPreviewItems.filter((item) => item.category === category)
}
