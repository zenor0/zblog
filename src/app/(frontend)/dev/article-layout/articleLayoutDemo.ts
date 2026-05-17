import { defaultLocale } from '@/shared/i18n/locales'
import type { MarkdownMediaLike } from '@/features/article/markdown/types'
import type { ResolvedPost } from '@/features/posts/server/queries'

export const articleLayoutInlineImageSource =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80'

export const articleLayoutMarkdownMediaBySource: Record<string, MarkdownMediaLike> = {
  [articleLayoutInlineImageSource]: {
    alt: '一张用于文章排版实验的工作台照片',
    caption: '这是一张用于观察图片块上下间距的示意图。',
    credit: 'Unsplash',
    filename: 'article-layout-lab-inline.jpg',
    height: 933,
    mimeType: 'image/jpeg',
    previewSVGURL: null,
    url: articleLayoutInlineImageSource,
    width: 1400,
  },
}

export const articleLayoutDemoContent = `
## 正文节奏先决定阅读舒适度

文章页面的第一层问题不是某个单独元素是否漂亮，而是读者能不能稳定地进入一条连续的阅读线。段落之间如果过紧，句群会粘在一起；如果过松，论证会被拆散成很多不相关的碎片。

这篇实验文章故意把常见内容全部放进同一条阅读流：普通段落、较长段落、列表、图片、代码块、表格、引用和组件化卡片。切换右下角的 preset 时，应该优先观察这些块之间的关系，而不是只看标题字号。

### 段落之间需要明确但克制的间隔

中文长文经常包含更密集的信息片段。行高需要给字面留出空间，但段落间距不应该每一段都像一个新章节。更好的规则是：普通段落保持轻间隔，标题和富文本块承担更大的节奏变化。

如果一段文字足够长，行长和行高会比段落外边距更影响舒适度。行长太宽时，眼睛回到下一行开头会吃力；行高太松时，读者会觉得页面很空，但信息关系并没有变清楚。

#### H4 应该是局部提示，不应该像新章节

H4 常常用于解释边界、条件或补充说明。它需要比正文更强，但不应该抢走 H2 和 H3 的层级。因此它的上方间距应该明显小于 H2，且下方内容需要贴近。

- 普通段落是正文流，间距应该稳定。
- 图片、代码、表格是插入块，间距应该更明确。
- 标题后的第一段应该和标题绑定，而不是被全局段落间距再次推开。

> 引用块应该改变语气，但不应该把正文节奏彻底打断。它更像一段带有来源感的正文，而不是一个产品提示框。

## 图片和图注是一个整体

图片块常见的问题是上方留白太小，下方 caption 又离图片太远。读者会先把图片当成正文的一部分，再把图注当成另一个孤立段落。比较舒服的做法是：图片作为插入块整体和正文拉开距离，但 caption 贴近图片。

![排版实验中的图片](${articleLayoutInlineImageSource} "这是一张用于观察图片块上下间距的示意图。"){#fig:layout-spacing}

图片之后回到正文时，也要给读者一个清晰的落点。图注不能占用正文段落的视觉重量，正文也不应该紧贴着 caption 开始。

> [!NOTE]
> GitHub 风格 callout 是另一种插入块。它需要比普通引用更明确，但不能比正文标题更醒目。颜色、边框、内边距和上下间距都要被放在同一个排版系统里考虑。

## 代码和表格需要偏实用的密度

代码块和表格不是普通段落。它们承载扫描、复制、比较和查错的任务，因此内部密度可以比正文更高；但它们插入正文的位置要足够清楚，否则读者会误以为段落还在继续。

\`\`\`tsx
export function ArticleRhythmSample() {
  return (
    <article data-reading-root>
      <h2>Heading rhythm</h2>
      <p>Paragraph rhythm follows the heading.</p>
    </article>
  )
}
\`\`\`

代码块之后的段落应该自然回到正文节奏。如果代码块下方留白过小，正文会像代码注释；如果过大，读者会误以为进入了新的大章节。

| Block | Layout question | Preferred relationship |
| --- | --- | --- |
| Paragraph | 行高和段距是否稳定 | 属于正文流 |
| Figure | 图片和图注是否成组 | 插入块，caption 贴近媒体 |
| Code | 内部密度是否可扫描 | 插入块，内部紧凑 |
| Table | 横向信息是否易比较 | 插入块，行距克制 |

: 富文本块排版观察点 {#tbl:block-rhythm}

表格需要比正文更强的边界。尤其在窄屏里，横向滚动容器不能破坏文章的整体宽度，也不能让表格 caption 漂离表格。

## 组件化富文本也要服从文章节奏

<NoticeCard tone="info" title="组件不是例外">
即使是白名单组件，也应该遵守同一套上下间距规则。组件内部可以有自己的结构，但它在文章里的外部节奏必须可预测。
</NoticeCard>

组件化内容经常会被误做成页面卡片。对于阅读页来说，它们更像编辑插入块：可以有边框和背景，但不应该在视觉上脱离文章本身。

<FeatureGrid items='[{"title":"Flow","status":"Body","description":"段落和列表维持连续阅读。"},{"title":"Interruptions","status":"Blocks","description":"图片、表格、代码、callout 使用更明确的上下留白。"},{"title":"Hierarchy","status":"Headings","description":"H2/H3/H4 通过上方留白和字号建立层级。"},{"title":"Captions","status":"Media","description":"caption 靠近它解释的对象。"}]' />

### 最终评估应该看整体而不是单点

一个 preset 是否舒服，不取决于 H2 大小或代码块背景，而取决于读者滚动整篇文章时能不能自然理解内容关系。理想结果是：正文连续，标题成组，插入块清楚，caption 贴近，目录不抢戏。
`.trim()

export const articleLayoutDemoResolvedPost: ResolvedPost = {
  bibliographyEntries: [],
  citationIndex: new Map(),
  missingCitationKeys: [],
  post: {
    id: -2,
    title: '文章富文本排版实验',
    excerpt:
      '这个开发页复用真实文章页面，用同一篇覆盖多种富文本的测试文章比较不同正文节奏、标题层级和插入块间距。',
    content: articleLayoutDemoContent,
    slug: 'article-layout-lab',
    tags: [
      { id: 'layout', value: 'layout' },
      { id: 'typography', value: 'typography' },
      { id: 'rich-text', value: 'rich text' },
    ],
    attachments: null,
    heroImage: {
      alt: '文章排版实验的编辑工作台',
      caption: 'Hero 图用于观察文章头图和正文之间的节奏。',
      createdAt: '2026-05-01T00:00:00.000Z',
      credit: 'Unsplash',
      filename: 'article-layout-lab-hero.jpg',
      filesize: null,
      focalX: null,
      focalY: null,
      height: 900,
      id: -20,
      importKey: null,
      mimeType: 'image/jpeg',
      ownerPost: null,
      previewSVGError: null,
      previewSVGFilename: null,
      previewSVGGeneratedAt: null,
      previewSVGStatus: null,
      previewSVGURL: null,
      thumbnailURL: null,
      updatedAt: '2026-05-01T00:00:00.000Z',
      url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=80',
      width: 1600,
    },
    translationStatus: 'original',
    publishedAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    _status: 'published',
    visibility: 'listed',
  },
  requestedLocale: defaultLocale,
  resolvedLocale: defaultLocale,
  sourcePost: null,
  usedDraftAccess: false,
  usedFallback: false,
}
