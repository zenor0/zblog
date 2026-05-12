import { ArticleProgressTableOfContents } from '@/features/article/ui/ArticleProgressTableOfContents'
import { PostTableOfContents } from '@/features/article/ui/PostTableOfContents'
import type { ArticleTocVariantID } from '@/features/frontend-variants/model/frontend-variants'
import type { MarkdownHeading } from '@/features/article/model/markdown-headings'

type ArticleTableOfContentsProps = {
  headings: MarkdownHeading[]
  label: string
  progressLabel: string
  variant: ArticleTocVariantID
}

export function ArticleTableOfContents(props: ArticleTableOfContentsProps) {
  if (props.variant === 'progress-map') {
    return (
      <ArticleProgressTableOfContents
        headings={props.headings}
        label={props.label}
        progressLabel={props.progressLabel}
      />
    )
  }

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
