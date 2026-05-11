import type { ReactNode } from 'react'
import {
  AlertCircleIcon,
  BadgeAlertIcon,
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { MediaDetails } from '@/features/media/ui/MediaDetails'
import { MediaSurface } from '@/features/media/ui/MediaSurface'
import { FeatureGrid } from '@/features/article/ui/markdown-components/FeatureGrid'
import { NoticeCard } from '@/features/article/ui/markdown-components/NoticeCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  ArticleBlockPreviewCategorySlug,
  ArticleBlockPreviewItem,
} from '@/features/article/model/article-block-previews'
import type { ResolvedMediaAsset } from '@/features/media/model/media'
import { highlightCodeSnippet } from '@/features/article/markdown/code-highlighting'

type ArticleBlockSampleProps = {
  item: ArticleBlockPreviewItem
}

const imageAsset: ResolvedMediaAsset = {
  alt: '静态文章块图片样例',
  caption: '用于观察图片块在文章正文中的默认宽度、边框和说明文字。',
  credit: 'Unsplash',
  downloadURL:
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
  extensionLabel: 'JPG',
  filename: 'article-block-preview.jpg',
  height: 933,
  kind: 'image',
  mimeType: 'image/jpeg',
  previewURL:
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
  src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
  width: 1400,
}

const pdfAsset: ResolvedMediaAsset = {
  alt: 'Article research notes',
  caption: 'PDF 没有可用预览时展示文件 fallback 和类型标记。',
  credit: null,
  downloadURL: '/media/article-research-notes.pdf',
  extensionLabel: 'PDF',
  filename: 'article-research-notes.pdf',
  height: null,
  kind: 'pdf',
  mimeType: 'application/pdf',
  previewURL: null,
  src: '/media/article-research-notes.pdf',
  width: null,
}

const articleBlockPreviewCode = `export function ArticleBlock() {
  return <section data-article-block="preview" />
}`

const highlightedArticleBlockPreviewCode = highlightCodeSnippet(articleBlockPreviewCode, 'tsx')

const unknownAsset: ResolvedMediaAsset = {
  alt: 'Supplementary dataset',
  caption: '未知类型文件保留下载语义，但不伪装为图片。',
  credit: null,
  downloadURL: '/media/supplementary-dataset.zip',
  extensionLabel: 'ZIP',
  filename: 'supplementary-dataset.zip',
  height: null,
  kind: 'unknown',
  mimeType: 'application/zip',
  previewURL: null,
  src: '/media/supplementary-dataset.zip',
  width: null,
}

function ArticleBlockFrame(props: ArticleBlockSampleProps & { children: ReactNode }) {
  const { children, item } = props

  return (
    <Card className="dev-reference-card scroll-mt-8" id={item.id}>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="grid gap-2">
            <CardTitle className="font-serif text-xl">{item.title}</CardTitle>
            <CardDescription className="leading-6">{item.description}</CardDescription>
          </div>
          <Badge variant="outline">{item.id}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="article-copy dev-article-block-sample">{children}</div>
      </CardContent>
    </Card>
  )
}

function CalloutSample(
  props: ArticleBlockSampleProps & {
    children: ReactNode
    icon: React.ComponentType<{ 'aria-hidden'?: true; className?: string }>
    label: string
    variant: 'caution' | 'custom' | 'important' | 'note' | 'tip' | 'warning'
  },
) {
  const { children, icon: Icon, item, label, variant } = props

  return (
    <ArticleBlockFrame item={item}>
      <aside
        className={`md-callout md-callout--${variant}`}
        data-callout-label={label}
        data-kind={variant}
      >
        <div className="md-callout__title">
          <Icon aria-hidden className="md-callout__icon" />
          <span>{label}</span>
        </div>
        <div className="md-callout__content">{children}</div>
      </aside>
    </ArticleBlockFrame>
  )
}

function StaticTable(props: { caption?: string; wide?: boolean }) {
  return (
    <div className="markdown-table__scroll">
      <table>
        <thead>
          <tr>
            <th>Block</th>
            <th>Role</th>
            <th>Density</th>
            {props.wide ? (
              <>
                <th>Desktop</th>
                <th>Mobile</th>
                <th>Review note</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Paragraph</td>
            <td>Reading flow</td>
            <td>Relaxed</td>
            {props.wide ? (
              <>
                <td>Full width copy column</td>
                <td>Single column</td>
                <td>Keep line height stable</td>
              </>
            ) : null}
          </tr>
          <tr>
            <td>Figure</td>
            <td>Evidence</td>
            <td>Medium</td>
            {props.wide ? (
              <>
                <td>Inline surface</td>
                <td>Contained width</td>
                <td>Caption stays attached</td>
              </>
            ) : null}
          </tr>
          <tr>
            <td>Code</td>
            <td>Reference</td>
            <td>Compact</td>
            {props.wide ? (
              <>
                <td>Horizontal scroll</td>
                <td>Horizontal scroll</td>
                <td>Language label visible</td>
              </>
            ) : null}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function TextSample(props: ArticleBlockSampleProps) {
  switch (props.item.id) {
    case 'heading-scale':
      return (
        <ArticleBlockFrame item={props.item}>
          <h2>二级标题定义一段文章主论点</h2>
          <p>标题下的第一段应该和标题形成明确绑定，而不是被普通段落节奏推得太远。</p>
          <h3>三级标题拆解论证层次</h3>
          <p>三级标题适合解释方法、原因、案例或局部结论。</p>
          <h4>四级标题用于局部提示</h4>
          <p>四级标题不应该像新章节，更像段落内部的轻量路标。</p>
        </ArticleBlockFrame>
      )
    case 'paragraph-inline':
      return (
        <ArticleBlockFrame item={props.item}>
          <p>
            正文可以混合 <strong>加粗强调</strong>、<em>斜体语气</em>、<code>inline code</code> 和{' '}
            <a href="https://payloadcms.com/docs" rel="noreferrer" target="_blank">
              外部链接
            </a>
            。这些状态应该足够清楚，但不能破坏连续阅读。
          </p>
          <p>
            第二段用于观察普通段落之间的垂直间距。中文长文通常需要稳定行高，而不是过度依赖段落外边距。
          </p>
        </ArticleBlockFrame>
      )
    case 'lists':
      return (
        <ArticleBlockFrame item={props.item}>
          <ul>
            <li>无序列表适合罗列能力、条件或观察点。</li>
            <li>列表项之间需要比正文段落更紧凑。</li>
            <li>长列表项应该自然换行，并保持项目符号与文本关系清楚。</li>
          </ul>
          <ol>
            <li>先确认内容意图。</li>
            <li>再选择合适的富文本块。</li>
            <li>最后在设计系统中回归检查。</li>
          </ol>
        </ArticleBlockFrame>
      )
    case 'blockquote':
      return (
        <ArticleBlockFrame item={props.item}>
          <blockquote>
            普通引用块应该改变文本语气，但不应该被误读成产品提示。它需要轻边界、低背景干扰和清晰的正文回流。
          </blockquote>
        </ArticleBlockFrame>
      )
    case 'code-block':
      return (
        <ArticleBlockFrame item={props.item}>
          <pre className="markdown-codeblock" data-language="tsx">
            <span className="markdown-codeblock__label">tsx</span>
            <code
              className="markdown-codeblock__code markdown-codeblock__code--highlighted"
              data-highlight-language={highlightedArticleBlockPreviewCode.language ?? undefined}
              data-highlighted={highlightedArticleBlockPreviewCode.highlighted ? 'true' : undefined}
              dangerouslySetInnerHTML={{ __html: highlightedArticleBlockPreviewCode.html }}
            />
          </pre>
        </ArticleBlockFrame>
      )
    case 'citation-links':
    default:
      return (
        <ArticleBlockFrame item={props.item}>
          <p>
            解析成功的文内引用应该像{' '}
            <a className="citation-link" href="#ref-fig-demo">
              Figure 1
            </a>{' '}
            这样可点击。 缺失引用保留原始文本并弱化，例如{' '}
            <a className="citation-link citation-link--missing" href="#missing-reference">
              @fig:missing
            </a>
            。
          </p>
        </ArticleBlockFrame>
      )
  }
}

function CalloutPreviewSample(props: ArticleBlockSampleProps) {
  switch (props.item.id) {
    case 'callout-tip':
      return (
        <CalloutSample icon={LightbulbIcon} item={props.item} label="Tip" variant="tip">
          <p>适合展示更高效的写作、编辑或排版建议。</p>
        </CalloutSample>
      )
    case 'callout-important':
      return (
        <CalloutSample
          icon={BadgeAlertIcon}
          item={props.item}
          label="Important"
          variant="important"
        >
          <p>适合标记读者继续阅读前必须理解的限制或前置条件。</p>
        </CalloutSample>
      )
    case 'callout-warning':
      return (
        <CalloutSample icon={TriangleAlertIcon} item={props.item} label="Warning" variant="warning">
          <p>适合提醒兼容性边界、误用风险或尚未稳定的功能。</p>
        </CalloutSample>
      )
    case 'callout-caution':
      return (
        <CalloutSample icon={AlertCircleIcon} item={props.item} label="Caution" variant="caution">
          <p>适合提示可能导致错误发布、数据丢失或不可逆修改的操作。</p>
        </CalloutSample>
      )
    case 'callout-custom':
      return (
        <CalloutSample icon={InfoIcon} item={props.item} label="Research Notes" variant="custom">
          <p>未知 label 仍然以 callout 呈现，用于承载团队自定义语义。</p>
        </CalloutSample>
      )
    case 'callout-note':
    default:
      return (
        <CalloutSample icon={InfoIcon} item={props.item} label="Note" variant="note">
          <p>适合补充背景信息、阅读上下文或不影响主结论的说明。</p>
        </CalloutSample>
      )
  }
}

function MediaSample(props: ArticleBlockSampleProps) {
  switch (props.item.id) {
    case 'figure-caption':
      return (
        <ArticleBlockFrame item={props.item}>
          <figure className="markdown-figure markdown-figure--image" id="ref-fig-demo">
            <MediaSurface asset={imageAsset} variant="inline" />
            <figcaption className="markdown-figure__details">
              <MediaDetails
                caption="Figure 1. 图片和 caption 应该形成一个整体。"
                credit="Unsplash"
              />
            </figcaption>
          </figure>
        </ArticleBlockFrame>
      )
    case 'pdf-preview':
      return (
        <ArticleBlockFrame item={props.item}>
          <a className="markdown-media-link" href={pdfAsset.downloadURL}>
            <MediaSurface asset={pdfAsset} variant="inline" />
          </a>
          <MediaDetails caption={pdfAsset.caption} className="markdown-media__details" />
        </ArticleBlockFrame>
      )
    case 'unknown-file':
      return (
        <ArticleBlockFrame item={props.item}>
          <a className="markdown-media-link" href={unknownAsset.downloadURL}>
            <MediaSurface asset={unknownAsset} variant="inline" />
          </a>
          <MediaDetails caption={unknownAsset.caption} className="markdown-media__details" />
        </ArticleBlockFrame>
      )
    case 'inline-image':
    default:
      return (
        <ArticleBlockFrame item={props.item}>
          <span className="markdown-media">
            <MediaSurface asset={imageAsset} variant="inline" />
            <MediaDetails
              caption={imageAsset.caption}
              className="markdown-media__details"
              credit={imageAsset.credit}
            />
          </span>
        </ArticleBlockFrame>
      )
  }
}

function TableSample(props: ArticleBlockSampleProps) {
  switch (props.item.id) {
    case 'captioned-table':
      return (
        <ArticleBlockFrame item={props.item}>
          <figure className="markdown-figure markdown-figure--table" id="ref-tbl-demo">
            <StaticTable />
            <figcaption className="markdown-figure__caption">
              Table 1. 富文本块排版观察点
            </figcaption>
          </figure>
        </ArticleBlockFrame>
      )
    case 'wide-table':
      return (
        <ArticleBlockFrame item={props.item}>
          <StaticTable wide />
        </ArticleBlockFrame>
      )
    case 'basic-table':
    default:
      return (
        <ArticleBlockFrame item={props.item}>
          <StaticTable />
        </ArticleBlockFrame>
      )
  }
}

function ComponentSample(props: ArticleBlockSampleProps) {
  switch (props.item.id) {
    case 'feature-grid':
      return (
        <ArticleBlockFrame item={props.item}>
          <FeatureGrid
            items={[
              { description: '用于文内引用和锚点预览。', status: 'native', title: 'Citation' },
              { description: '用于图片、PDF 和未知文件状态。', status: 'media', title: 'Media' },
              { description: '用于复杂横向信息比较。', status: 'layout', title: 'Tables' },
              { description: '用于编辑提示和风险提示。', status: 'semantic', title: 'Callouts' },
            ]}
          />
        </ArticleBlockFrame>
      )
    case 'notice-card':
    default:
      return (
        <ArticleBlockFrame item={props.item}>
          <NoticeCard title="组件化富文本也遵守文章节奏" tone="info">
            <p>组件内部可以有自己的结构，但外部间距需要和普通文章块保持一致。</p>
          </NoticeCard>
        </ArticleBlockFrame>
      )
  }
}

export function ArticleBlockPreviewSample(
  props: ArticleBlockSampleProps & {
    category: ArticleBlockPreviewCategorySlug
  },
) {
  switch (props.category) {
    case 'callouts':
      return <CalloutPreviewSample item={props.item} />
    case 'media':
      return <MediaSample item={props.item} />
    case 'tables':
      return <TableSample item={props.item} />
    case 'components':
      return <ComponentSample item={props.item} />
    case 'text':
    default:
      return <TextSample item={props.item} />
  }
}
