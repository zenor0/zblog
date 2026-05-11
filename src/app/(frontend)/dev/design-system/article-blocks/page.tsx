import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Blocks } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  articleBlockPreviewCategories,
  getArticleBlockPreviewItems,
} from '@/features/article/model/article-block-previews'

export const metadata: Metadata = {
  title: 'Article Block Previews',
  robots: { index: false, follow: false },
}

export default function ArticleBlockPreviewIndexPage() {
  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <Link
          className="editorial-link inline-flex items-center gap-2 text-sm"
          href="/dev/design-system"
        >
          <ArrowLeft aria-hidden="true" /> Design System
        </Link>
        <p className="section-kicker">Design System / Article Blocks</p>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="flex max-w-4xl flex-col gap-5">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">文章块静态样例矩阵。</h1>
            <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
              这里不走真实 Markdown 渲染流程，而是用静态 JSX
              枚举文章中可能出现的富文本块和状态，方便独立调整视觉预期。
            </p>
          </div>
          <Card className="dev-reference-card">
            <CardHeader>
              <Blocks aria-hidden="true" />
              <CardTitle className="font-serif text-xl">Preview Contract</CardTitle>
              <CardDescription>先覆盖状态，再接入真实文章。</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              每个分类页展示一组静态样例；现有真实渲染对照保留在 /dev/article-layout。
            </CardContent>
          </Card>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {articleBlockPreviewCategories.map((category) => {
          const items = getArticleBlockPreviewItems(category.slug)

          return (
            <Card className="dev-reference-card" key={category.slug}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <CardTitle className="font-serif text-xl">{category.title}</CardTitle>
                    <CardDescription className="leading-6">{category.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <Badge key={item.id} variant="outline">
                      {item.title}
                    </Badge>
                  ))}
                </div>
                <Link
                  className="editorial-link inline-flex items-center gap-2 text-sm"
                  href={category.href}
                >
                  打开分类样例 <ArrowRight aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
