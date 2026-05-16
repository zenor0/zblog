import { ArticleProgressTableOfContents } from '@/features/article/ui/ArticleProgressTableOfContents'
import { PostTableOfContents } from '@/features/article/ui/PostTableOfContents'
import type {
  ArticleTocVariantID,
  FrontendVariantConfigBySurface,
} from '@/features/frontend-variants/model/frontend-variants'
import {
  FrontendVariantSlot,
  type FrontendVariantRendererMap,
} from '@/features/frontend-variants/ui/FrontendVariantSlot'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

type ArticleTableOfContentsSlotProps = {
  config?: FrontendVariantConfigBySurface['article.toc']
  headings: MarkdownHeading[]
  label: string
  progressLabel: string
}

type ArticleTableOfContentsProps = ArticleTableOfContentsSlotProps & {
  variant: ArticleTocVariantID
}

function StandardArticleTableOfContents(props: ArticleTableOfContentsSlotProps) {
  return (
    <div data-article-toc-variant="standard">
      <PostTableOfContents
        headings={props.headings}
        label={props.label}
        progressLabel={props.progressLabel}
      />
    </div>
  )
}

const articleTocRenderers = {
  'progress-map': ArticleProgressTableOfContents,
  standard: StandardArticleTableOfContents,
} satisfies FrontendVariantRendererMap<'article.toc', ArticleTableOfContentsSlotProps>

export function ArticleTableOfContents(props: ArticleTableOfContentsProps) {
  const { config, variant, ...slotProps } = props

  return (
    <FrontendVariantSlot
      config={config}
      renderers={articleTocRenderers}
      slotProps={slotProps}
      surface="article.toc"
      variant={variant}
    />
  )
}
