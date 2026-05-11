import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, HistoryIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatLongDate } from '@/i18n/format'
import { requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/shared/i18n/locales'
import { getPostBySlug, getPostVersionDiffs } from '@/features/posts/server/queries'
import { getSiteSettings } from '@/features/site-settings/model/site-settings'

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const history = await getTranslations({ locale, namespace: 'HistoryPage' })
  const siteSettings = await getSiteSettings(locale)

  return {
    robots: {
      follow: true,
      index: false,
    },
    title: `${history('title')} | ${siteSettings.siteName}`,
  }
}

export default async function PostHistoryPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const common = await getTranslations({ locale, namespace: 'Common' })
  const history = await getTranslations({ locale, namespace: 'HistoryPage' })
  const post = await getPostBySlug({ locale, slug })

  if (!post) {
    notFound()
  }

  const versionDiffs = await getPostVersionDiffs({
    locale: post.resolvedLocale,
    postID: post.post.id,
  })

  return (
    <div className="page-frame frontend-shell">
      <div className="mb-6 sm:mb-8">
        <Button asChild size="sm" variant="ghost">
          <Link href={buildLocalePath(locale, `/posts/${slug}`)}>
            <ArrowLeftIcon data-icon="inline-start" />
            {article('backToArticle')}
          </Link>
        </Button>
      </div>

      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b pb-8">
          <Badge variant="outline">
            <HistoryIcon />
            {history('title')}
          </Badge>
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl">{history('title')}</h1>
            <p className="text-base leading-8 text-foreground/68">
              {history('versionHistorySummary', {
                count: versionDiffs.length,
                title: post.post.title,
              })}
            </p>
          </div>
        </header>

        {versionDiffs.length === 0 ? (
          <p className="py-10 text-center text-sm leading-7 text-muted-foreground">
            {history('noVersions')}
          </p>
        ) : (
          <div className="flex flex-col">
            {versionDiffs.map((entry) => {
              const changedDiffs = entry.diffs.filter((diff) =>
                diff.lines.some((line) => line.type !== 'unchanged'),
              )

              return (
                <section className="border-b py-6" key={entry.version.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-2">
                      <h2 className="font-serif text-xl sm:text-2xl">
                        {formatLongDate({
                          fallback: common('unscheduled'),
                          locale: post.resolvedLocale,
                          value: entry.version.updatedAt,
                        })}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {common('versionID')} {entry.version.id}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          entry.version.version._status === 'published' ? 'secondary' : 'outline'
                        }
                      >
                        {entry.version.version._status === 'published'
                          ? common('publishedLabel')
                          : common('draftLabel')}
                      </Badge>
                      {entry.version.latest ? (
                        <Badge variant="default">{common('latestSnapshot')}</Badge>
                      ) : null}
                    </div>
                  </div>

                  {changedDiffs.length === 0 ? (
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {common('versionID')} {entry.version.id}
                    </p>
                  ) : (
                    <div className="mt-5 flex flex-col gap-5">
                      {changedDiffs.map((diff, index) => (
                        <div
                          className="flex flex-col gap-3"
                          key={`${entry.version.id}-${diff.field}`}
                        >
                          {index > 0 ? <Separator /> : null}
                          <div className="flex flex-col gap-2">
                            <h3 className="font-medium">{diff.field}</h3>
                            <ScrollArea className="w-full border border-border/70">
                              <pre className="min-w-full p-4 text-sm leading-7 whitespace-pre-wrap">
                                {diff.lines.map((line, lineIndex) => (
                                  <span
                                    className={
                                      line.type === 'added'
                                        ? 'block text-primary'
                                        : line.type === 'removed'
                                          ? 'block text-destructive'
                                          : 'block text-muted-foreground'
                                    }
                                    key={`${diff.field}-${lineIndex}`}
                                  >
                                    {line.type === 'added'
                                      ? '+ '
                                      : line.type === 'removed'
                                        ? '- '
                                        : '  '}
                                    {line.value}
                                  </span>
                                ))}
                              </pre>
                            </ScrollArea>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
