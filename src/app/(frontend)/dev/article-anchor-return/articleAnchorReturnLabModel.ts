import { defaultLocale } from '@/shared/i18n/locales'
import type { MarkdownMediaLike } from '@/features/article/markdown/types'
import type { ResolvedPost } from '@/features/posts/server/queries'

export type ArticleAnchorReturnVariantID = 'baseline' | 'fade-pill' | 'edge-tab' | 'auto-toast'

export type ArticleAnchorReturnVariant = {
  description: string
  id: ArticleAnchorReturnVariantID
  label: string
}

export const articleAnchorReturnVariants: ArticleAnchorReturnVariant[] = [
  {
    description: '保留生产页当前的目标旁按钮，作为可对照的基线。',
    id: 'baseline',
    label: '当前按钮',
  },
  {
    description: '先显示短文字胶囊，几秒后折成图标，适合保留可发现性。',
    id: 'fade-pill',
    label: '渐隐胶囊',
  },
  {
    description: '贴近屏幕边缘，减少和正文列的竞争，移动端更克制。',
    id: 'edge-tab',
    label: '靠边标签',
  },
  {
    description: '作为短暂提示出现，超时自动离场，干扰最少。',
    id: 'auto-toast',
    label: '自动提示',
  },
]

export const defaultArticleAnchorReturnVariantID: ArticleAnchorReturnVariantID = 'fade-pill'

export function getArticleAnchorReturnVariant(id: ArticleAnchorReturnVariantID) {
  return (
    articleAnchorReturnVariants.find((variant) => variant.id === id) ??
    articleAnchorReturnVariants[1]
  )
}

export const articleAnchorReturnImageSource =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80'

export const articleAnchorReturnMarkdownMediaBySource: Record<string, MarkdownMediaLike> = {
  [articleAnchorReturnImageSource]: {
    alt: '桌面上的移动设备和阅读笔记',
    caption: '这个目标用于观察跳转后返回控件是否遮挡窄屏正文。',
    credit: 'Unsplash',
    filename: 'article-anchor-return-target.jpg',
    height: 933,
    mimeType: 'image/jpeg',
    previewSVGURL: null,
    url: articleAnchorReturnImageSource,
    width: 1400,
  },
}

export const articleAnchorReturnDemoContent = `
## 起点：从窄屏阅读中跳走

这页用来验证页内锚点跳转后的返回控件。读者可能正在一段正文里点击图表、注释或目录链接，跳到很远的位置后，需要一个能够回到原阅读位置的入口。

先从这里点击 [@fig:return-control-target]，观察跳转完成后控件在移动端和桌面端的位置、大小、关闭方式以及是否遮挡正文。也可以从右侧目录点击后面的章节，比较同一套控件在标题跳转时的表现。

### 为什么它不能太像一个块

移动端的阅读宽度很窄，任何固定浮层都会和正文争夺空间。返回控件必须能被发现，但不能长时间占据一段完整的阅读宽度。

桌面端也有类似问题：如果控件停在目标附近，它可能挡住图片说明、表格首列或标题起始文字。实验页保留关闭按钮，是为了验证用户是否能主动清理这类临时提示。

## 中段：让原位置和目标位置拉开距离

为了模拟真实长文，正文中间保留几段较长内容。这样从起点跳到图像目标时，返回动作才有实际距离，也能观察 smooth scroll 结束后控件出现的时机。

读者在跳转前通常已经建立了上下文：上一段话的论点、后续段落的连接，以及当前屏幕里还没读完的尾句。返回控件服务的是这条阅读线，而不是单纯恢复一个滚动数值。

### 关闭只应该影响当前跳转

如果用户点击关闭，合理默认是隐藏当前这一次提示。下一次点击页内锚点时，控件仍然应该出现，因为那是新的阅读中断。

这个策略比长期记住隐藏更保守。实验阶段不应该让用户因为一次关闭就永久失去返回能力，也不应该为了低打扰牺牲可发现性。

## 目标：图片和表格引用

下面的图片是主要跳转目标。控件如果贴近目标显示，应该避免盖住 caption；如果贴边或底部显示，应该避免把正文列压得太窄。

![锚点返回控件目标](${articleAnchorReturnImageSource} "这个目标用于观察跳转后返回控件是否遮挡窄屏正文。"){#fig:return-control-target}

图片之后继续放入一段正文，便于观察返回控件是否挡住后续阅读。你也可以点击 [@tbl:return-control-matrix] 跳到表格目标，比较不同块类型附近的空间压力。

| 方案 | 初始可见性 | 阅读干扰 | 适合场景 |
| --- | --- | --- | --- |
| 当前按钮 | 高 | 高 | 生产基线对照 |
| 渐隐胶囊 | 中 | 中低 | 需要提示但不想长期占位 |
| 靠边标签 | 中 | 低 | 移动端或正文列较窄 |
| 自动提示 | 低 | 最低 | 用户已经熟悉交互后 |

: 返回控件方案比较 {#tbl:return-control-matrix}

## 结尾：回到原来的阅读线

当返回控件被点击时，页面应该回到触发跳转前的滚动位置。这个行为不需要改变 URL 历史栈，也不需要清理用户已经进入的 hash；它只负责恢复阅读上下文。

如果后续决定把某个方案迁入生产，可以继续在这个实验页保留其他候选，作为移动端、深色模式和长文场景的回归样例。
`.trim()

export const articleAnchorReturnDemoResolvedPost: ResolvedPost = {
  bibliographyEntries: [],
  citationIndex: new Map(),
  missingCitationKeys: [],
  post: {
    id: -3,
    title: '锚点返回控件实验',
    excerpt: '对比页内锚点跳转后的返回阅读位置控件，重点观察移动端窄宽度下的可发现性和低打扰程度。',
    content: articleAnchorReturnDemoContent,
    slug: 'article-anchor-return-lab',
    tags: [
      { id: 'anchors', value: 'anchors' },
      { id: 'mobile', value: 'mobile' },
      { id: 'navigation', value: 'navigation' },
    ],
    attachments: null,
    heroImage: null,
    translationStatus: 'original',
    publishedAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    createdAt: '2026-05-01T00:00:00.000Z',
    _status: 'published',
  },
  requestedLocale: defaultLocale,
  resolvedLocale: defaultLocale,
  sourcePost: null,
  usedDraftAccess: false,
  usedFallback: false,
}
