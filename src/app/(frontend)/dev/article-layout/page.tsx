import type { Metadata } from 'next'

import { PostArticle } from '@/components/frontend/PostArticle'
import { defaultLocale, getLocaleLabel } from '@/lib/locales'

import { ArticleLayoutLabControls } from './ArticleLayoutLabControls'
import {
  articleLayoutDemoResolvedPost,
  articleLayoutMarkdownMediaBySource,
} from './articleLayoutDemo'

export const metadata: Metadata = {
  title: 'Article Layout Lab',
  robots: { index: false, follow: false },
}

export default function ArticleLayoutLabPage() {
  return (
    <>
      <ArticleLayoutLabControls />
      <PostArticle
        backHref="/dev"
        backLabel="开发参考"
        historyHref={null}
        locale={defaultLocale}
        localeLinks={[
          {
            href: '/dev/article-layout',
            label: getLocaleLabel(defaultLocale),
            locale: defaultLocale,
          },
        ]}
        markdownMediaBySource={articleLayoutMarkdownMediaBySource}
        previewExitPath="/dev/article-layout"
        resolved={articleLayoutDemoResolvedPost}
      />
    </>
  )
}
