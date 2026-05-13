import type { Metadata } from 'next'
import Link from 'next/link'

import {
  PostArticleTitleBlock,
  postArticleTitleLayoutOptions,
} from '@/features/posts/ui/PostArticleTitleBlock'

export const metadata: Metadata = {
  title: 'Article Title Layouts',
  robots: { index: false, follow: false },
}

const sampleTitle = '标题、摘要和元信息的距离应该保持克制'
const sampleExcerpt =
  '这段摘要用于观察标题下方的第一行文字是否足够贴近，同时保留正式文章页需要的安静留白。'

function SampleMeta() {
  return (
    <>
      <span>2026年5月1日</span>
      <span>7 分钟阅读</span>
      <span>128 次浏览</span>
      <span>简体中文</span>
      <Link className="editorial-link no-underline" href="/dev/article-title-layouts">
        版本历史
      </Link>
    </>
  )
}

export default function ArticleTitleLayoutsPage() {
  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <p className="section-kicker">Article Title Layouts</p>
        <div className="flex max-w-4xl flex-col gap-4">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
            正式文章页标题区候选。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            三个版本都移除了正式状态标签，并压缩标题和摘要之间的距离。
          </p>
        </div>
      </header>

      <div className="dev-article-title-candidates">
        {postArticleTitleLayoutOptions.map((option) => (
          <section className="dev-article-title-candidate" key={option.id}>
            <div className="dev-article-title-candidate__intro">
              <p className="section-kicker">{option.name}</p>
              <p>{option.description}</p>
            </div>
            <PostArticleTitleBlock
              className="dev-article-title-candidate__preview"
              excerpt={sampleExcerpt}
              headingLevel="h2"
              meta={<SampleMeta />}
              title={sampleTitle}
              variant={option.id}
            />
          </section>
        ))}
      </div>
    </div>
  )
}
