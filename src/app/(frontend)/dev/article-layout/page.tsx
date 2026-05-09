import type { Metadata } from 'next'
import type { CSSProperties } from 'react'

import { PostArticle } from '@/components/frontend/PostArticle'
import { defaultLocale, getLocaleLabel } from '@/lib/locales'
import { resolveArticleLayoutConfig } from '@/lib/article-layout'

import { ArticleLayoutLabControls } from './ArticleLayoutLabControls'
import {
  articleLayoutDemoResolvedPost,
  articleLayoutMarkdownMediaBySource,
} from './articleLayoutDemo'
import { defaultArticleLayoutPresetID } from './articleLayoutPresets'

export const metadata: Metadata = {
  title: 'Article Layout Lab',
  robots: { index: false, follow: false },
}

export default function ArticleLayoutLabPage() {
  const defaultLayout = resolveArticleLayoutConfig({ preset: defaultArticleLayoutPresetID })

  return (
    <div
      data-article-design-preset={defaultLayout.presetID}
      data-article-layout-lab-root=""
      data-article-layout-preset={defaultLayout.presetID}
      style={defaultLayout.style as CSSProperties}
    >
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
    </div>
  )
}
