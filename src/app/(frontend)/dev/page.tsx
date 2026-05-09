import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { devReferenceSections } from '@/lib/dev-reference'

export const metadata: Metadata = {
  title: 'Development References',
  robots: { index: false, follow: false },
}

export default function DevReferenceIndexPage() {
  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <p className="section-kicker">Development Reference</p>
        <div className="flex max-w-4xl flex-col gap-5">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
            从设计系统开始，分层开发前台体验。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            这里集中放置面向开发的参考页面。基础设计语言稳定沉淀在 Design
            System，尚未确定的交互组件进入独立实验室，避免直接耦合到真实业务流程。
          </p>
        </div>
      </header>

      <div className="grid gap-10">
        {devReferenceSections.map((section) => (
          <section className="grid gap-4" key={section.id}>
            <div className="grid gap-2 border-b border-border pb-4 md:grid-cols-[16rem_minmax(0,1fr)]">
              <h2 className="font-serif text-2xl">{section.title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {section.description}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {section.items.map((item) => (
                <Card className="dev-reference-card" key={item.slug}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-2">
                        <CardTitle className="font-serif text-xl">{item.title}</CardTitle>
                        <CardDescription className="leading-6">{item.description}</CardDescription>
                      </div>
                      <Badge variant={item.status === 'foundation' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-5">
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Link
                      className="editorial-link inline-flex items-center gap-2 text-sm"
                      href={item.href}
                    >
                      打开参考页 <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
