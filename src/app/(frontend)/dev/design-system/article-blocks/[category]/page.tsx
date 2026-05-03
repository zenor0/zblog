import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  articleBlockPreviewCategories,
  getArticleBlockPreviewCategory,
  getArticleBlockPreviewItems,
  type ArticleBlockPreviewCategorySlug,
} from '@/lib/article-block-previews'

import { ArticleBlockPreviewSample } from '../ArticleBlockPreviewSamples'

export function generateStaticParams() {
  return articleBlockPreviewCategories.map((category) => ({
    category: category.slug,
  }))
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: categoryParam } = await props.params
  const category = getArticleBlockPreviewCategory(categoryParam)

  if (!category) {
    return {
      robots: { index: false, follow: false },
      title: 'Article Block Preview',
    }
  }

  return {
    robots: { index: false, follow: false },
    title: `${category.title} Article Block Previews`,
  }
}

export default async function ArticleBlockPreviewCategoryPage(props: {
  params: Promise<{ category: string }>
}) {
  const { category: categoryParam } = await props.params
  const category = getArticleBlockPreviewCategory(categoryParam)

  if (!category) {
    notFound()
  }

  const items = getArticleBlockPreviewItems(category.slug)

  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <div className="flex flex-wrap gap-3">
          <Link
            className="editorial-link inline-flex items-center gap-2 text-sm"
            href="/dev/design-system/article-blocks"
          >
            <ArrowLeft aria-hidden="true" /> Article Blocks
          </Link>
          <Link
            className="editorial-link inline-flex items-center gap-2 text-sm"
            href="/dev/design-system"
          >
            Design System
          </Link>
        </div>
        <p className="section-kicker">Article Blocks / {category.slug}</p>
        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-serif text-6xl leading-none tracking-[-0.055em] sm:text-7xl">
            {category.title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            {category.description}
          </p>
        </div>
        <nav aria-label={`${category.title} 样例`} className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge asChild key={item.id} variant="outline">
              <a href={`#${item.id}`}>{item.title}</a>
            </Badge>
          ))}
        </nav>
      </header>

      <section className="grid gap-5">
        {items.map((item) => (
          <ArticleBlockPreviewSample
            category={category.slug as ArticleBlockPreviewCategorySlug}
            item={item}
            key={item.id}
          />
        ))}
      </section>
    </div>
  )
}
