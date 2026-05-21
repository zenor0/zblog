import type { ResolvedPage } from '@/features/pages/server/queries'

import { MarkdownRenderer } from '@/features/article/markdown'
import { PostLivePreviewRefresh } from '@/features/posts/ui/PostLivePreviewRefresh'
import { UtilityPageShell } from '@/features/utility-pages/ui/UtilityPage'

function buildPageCopy(resolved: ResolvedPage) {
  const { page } = resolved

  return {
    description: page.description ?? '',
    effectiveDateLabel: page.effectiveDateLabel ?? undefined,
    eyebrow: page.eyebrow ?? '',
    metaDescription: page.seo?.metaDescription || page.description || '',
    sections: [],
    title: page.title ?? '',
  }
}

export function PageArticle(props: { resolved: ResolvedPage; serverURL?: string }) {
  return (
    <>
      {props.serverURL ? <PostLivePreviewRefresh serverURL={props.serverURL} /> : null}
      <div data-cms-page={props.resolved.page.slug}>
        <UtilityPageShell copy={buildPageCopy(props.resolved)}>
          <section className="article-copy" data-page-body="">
            <MarkdownRenderer source={props.resolved.page.content} />
          </section>
        </UtilityPageShell>
      </div>
    </>
  )
}
