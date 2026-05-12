import type { Metadata } from 'next'

import { PostArticle } from '@/features/posts/ui/PostArticle'
import { defaultLocale, getLocaleLabel } from '@/shared/i18n/locales'

import {
  ArticleAnchorReturnLabNavigation,
  ArticleAnchorReturnLabShell,
} from './ArticleAnchorReturnLab'
import {
  articleAnchorReturnDemoResolvedPost,
  articleAnchorReturnMarkdownMediaBySource,
} from './articleAnchorReturnLabModel'

export const metadata: Metadata = {
  title: 'Article Anchor Return Lab',
  robots: { index: false, follow: false },
}

export default function ArticleAnchorReturnLabPage() {
  return (
    <ArticleAnchorReturnLabShell>
      <PostArticle
        backHref="/dev"
        backLabel="开发参考"
        historyHref={null}
        locale={defaultLocale}
        localeLinks={[
          {
            href: '/dev/article-anchor-return',
            label: getLocaleLabel(defaultLocale),
            locale: defaultLocale,
          },
        ]}
        markdownMediaBySource={articleAnchorReturnMarkdownMediaBySource}
        previewExitPath="/dev/article-anchor-return"
        renderAnchorNavigation={({ returnLabel }) => (
          <ArticleAnchorReturnLabNavigation returnLabel={returnLabel} />
        )}
        resolved={articleAnchorReturnDemoResolvedPost}
      />
    </ArticleAnchorReturnLabShell>
  )
}
