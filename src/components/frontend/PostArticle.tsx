import Link from 'next/link'
import {
  ArrowLeftIcon,
  Clock3Icon,
  FileWarningIcon,
  HistoryIcon,
  LanguagesIcon,
  LibraryBigIcon,
  PaperclipIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/frontend/LocaleSwitcher'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { describeBibliographyEntry } from '@/lib/bibliography'
import { resolveMediaAsset } from '@/lib/media'
import type { ResolvedPost } from '@/lib/posts'
import { getLocaleLabel, type AppLocale } from '@/lib/locales'
import { MarkdownRenderer } from '@/lib/markdown'
import { buildExitPreviewURL } from '@/lib/preview'
import { estimateReadingMinutes, formatLongDate } from '@/i18n/format'

type LocaleLink = {
  href: string
  label: string
  locale: AppLocale
}

function PreviewNotice(props: {
  body: string
  exitLabel: string
  exitHref: string
  title: string
}) {
  const { body, exitHref, exitLabel, title } = props

  return (
    <Alert className="border-border bg-transparent" data-embedded-hidden="true">
      <SparklesIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="gap-3">
        <p>{body}</p>
        <Button asChild size="sm" variant="outline">
          <Link href={exitHref}>{exitLabel}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function TranslationNotice(props: { message: string; title: string; tone: 'info' | 'warning' }) {
  const { message, title, tone } = props
  const Icon = tone === 'warning' ? TriangleAlertIcon : LanguagesIcon

  return (
    <Alert
      className={
        tone === 'warning' ? 'border-destructive/40 bg-transparent' : 'border-border bg-transparent'
      }
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
      </AlertDescription>
    </Alert>
  )
}

export async function PostArticle(props: {
  backHref: string
  backLabel: string
  historyHref?: null | string
  locale: AppLocale
  localeLinks: LocaleLink[]
  previewExitPath: string
  resolved: ResolvedPost
}) {
  const { backHref, backLabel, historyHref, locale, localeLinks, previewExitPath, resolved } = props
  const {
    bibliographyEntries,
    citationIndex,
    missingCitationKeys,
    post,
    sourcePost,
    usedDraftAccess,
    usedFallback,
  } = resolved
  const article = await getTranslations({ locale, namespace: 'Article' })
  const common = await getTranslations({ locale, namespace: 'Common' })
  const heroImage = post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null
  const attachments = (post.attachments ?? []).filter(
    (item) => item.file && typeof item.file === 'object' && item.file.url,
  )
  const hasSidebar = Boolean(post.tags?.length || attachments.length || bibliographyEntries.length)
  const displayTitle =
    typeof post.title === 'string' && post.title.trim().length > 0
      ? post.title
      : usedDraftAccess
        ? article('untitledDraft')
        : article('untitledPost')
  const exitPreviewHref = buildExitPreviewURL(previewExitPath)
  const fallbackMessage = usedFallback
    ? article('fallbackNotice', {
        requestedLocale: getLocaleLabel(resolved.requestedLocale),
        resolvedLocale: getLocaleLabel(resolved.resolvedLocale),
      })
    : null
  const machineTranslationMessage =
    !fallbackMessage && sourcePost?.translationStatus === 'machine'
      ? article('machineTranslationNotice', {
          locale: getLocaleLabel(locale),
          sourceLocale: getLocaleLabel(sourcePost.translatedFromLocale ?? resolved.resolvedLocale),
        })
      : null
  const showNotices =
    usedDraftAccess ||
    Boolean(fallbackMessage) ||
    Boolean(machineTranslationMessage) ||
    missingCitationKeys.length > 0

  return (
    <div className="page-frame frontend-shell">
      <div
        className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
        data-embedded-hidden="true"
      >
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href={backHref}>
            <ArrowLeftIcon data-icon="inline-start" />
            {backLabel}
          </Link>
        </Button>

        <LocaleSwitcher
          activeLocale={locale}
          items={localeLinks}
          label={common('localeNavigation')}
        />
      </div>

      <article className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-5 border-b pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {formatLongDate({
                  fallback: common('unscheduled'),
                  locale: resolved.resolvedLocale,
                  value: post.publishedAt ?? post.updatedAt,
                })}
              </Badge>
              <Badge variant="secondary">
                <Clock3Icon />
                {article('readingTime', {
                  minutes: estimateReadingMinutes(post.content),
                })}
              </Badge>
              <Badge variant="outline">
                <LanguagesIcon />
                {getLocaleLabel(resolved.resolvedLocale)}
              </Badge>
              {historyHref ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={historyHref}>
                    <HistoryIcon data-icon="inline-start" />
                    {article('versionHistory')}
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <p className="section-kicker">
                {usedDraftAccess ? article('previewTitle') : common('publishedLabel')}
              </p>
              <h1 className="max-w-4xl font-serif text-4xl leading-none tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                {displayTitle}
              </h1>
              {post.excerpt ? (
                <p className="max-w-3xl text-base leading-8 text-foreground/68 sm:text-lg">
                  {post.excerpt}
                </p>
              ) : null}
            </div>
          </header>

          {showNotices ? (
            <div className="grid gap-3">
              {usedDraftAccess ? (
                <PreviewNotice
                  body={article('previewBody')}
                  exitHref={exitPreviewHref}
                  exitLabel={article('exitPreview')}
                  title={article('previewTitle')}
                />
              ) : null}
              {fallbackMessage ? (
                <TranslationNotice
                  message={fallbackMessage}
                  title={article('fallbackTitle')}
                  tone="warning"
                />
              ) : null}
              {machineTranslationMessage ? (
                <TranslationNotice
                  message={machineTranslationMessage}
                  title={article('machineTranslationTitle')}
                  tone="info"
                />
              ) : null}
              {missingCitationKeys.length > 0 ? (
                <Alert className="border-destructive/40 bg-transparent">
                  <FileWarningIcon />
                  <AlertTitle>{article('bibliographyMismatchTitle')}</AlertTitle>
                  <AlertDescription className="gap-3">
                    <p>{article('bibliographyMismatchIntro')}</p>
                    <div className="flex flex-wrap gap-2">
                      {missingCitationKeys.map((key) => (
                        <Badge key={key} variant="outline">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          {heroImage?.url ? (
            <figure className="flex flex-col gap-3 border-b pb-8">
              <MediaSurface
                alt={heroImage.alt || displayTitle}
                loading="eager"
                media={heroImage}
                variant="hero"
              />
              {heroImage.caption || heroImage.credit ? (
                <figcaption className="flex flex-wrap gap-2 text-sm leading-7 text-muted-foreground">
                  {heroImage.caption ? <span>{heroImage.caption}</span> : null}
                  {heroImage.credit ? <span>{heroImage.credit}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <section className="article-copy">
            <MarkdownRenderer citationIndex={citationIndex} source={post.content} />
          </section>
        </div>

        {hasSidebar ? (
          <aside className="flex min-w-0 flex-col gap-8 border-t pt-8 xl:sticky xl:top-6 xl:self-start xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
            {post.tags?.length ? (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-medium">
                  <SparklesIcon />
                  {common('tags')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag.id ?? tag.value} variant="secondary">
                      {tag.value}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            {attachments.length ? (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-medium">
                  <PaperclipIcon />
                  {common('attachments')}
                </h2>
                <div className="flex flex-col">
                  {attachments.map((attachment, index) => {
                    const file = attachment.file as Exclude<typeof attachment.file, number>
                    const asset = resolveMediaAsset({
                      alt: attachment.label || file.alt || file.filename,
                      media: file,
                    })
                    const typeLabel =
                      asset?.kind === 'pdf' ? 'PDF' : asset?.extensionLabel || 'FILE'

                    return (
                      <div key={attachment.id ?? file.id}>
                        {index > 0 ? <Separator /> : null}
                        <a
                          className="group flex flex-col gap-4 py-4 transition-colors hover:text-primary sm:flex-row"
                          href={file.url ?? '#'}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <div className="sm:w-28 sm:flex-none">
                            <MediaSurface
                              alt={attachment.label || file.alt || file.filename}
                              asset={asset}
                              variant="attachment"
                            />
                          </div>
                          <span className="flex min-w-0 flex-1 flex-col gap-2">
                            <span className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{typeLabel}</Badge>
                              {file.filename ? (
                                <span className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                  {file.filename}
                                </span>
                              ) : null}
                            </span>
                            <span className="font-medium leading-6 text-foreground transition-colors group-hover:text-primary">
                              {attachment.label || file.filename || file.alt}
                            </span>
                            {attachment.description ? (
                              <span className="text-sm leading-6 text-muted-foreground">
                                {attachment.description}
                              </span>
                            ) : null}
                          </span>
                        </a>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {bibliographyEntries.length ? (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-medium">
                  <LibraryBigIcon />
                  {common('references')}
                </h2>
                <ol className="flex flex-col">
                  {bibliographyEntries.map((entry, index) => (
                    (() => {
                      const display = describeBibliographyEntry(entry)
                      const displayYear = display.year || common('referenceNoDate')
                      const roleLabel =
                        display.creatorRole === 'editor'
                          ? common('referenceRoleEditor')
                          : display.creatorRole === 'translator'
                            ? common('referenceRoleTranslator')
                            : null
                      const typeLabel =
                        entry.entryType.trim().length > 0
                          ? entry.entryType.replace(/-/g, ' ')
                          : common('referenceItem')

                      return (
                        <li
                          className="flex gap-3 border-b py-4 last:border-b-0"
                          id={`reference-${index + 1}`}
                          key={entry.citationKey}
                        >
                          <Badge variant="outline">[{index + 1}]</Badge>
                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <p className="text-sm leading-7 text-foreground/82">
                              {display.creators ? <>{display.creators}</> : null}
                              {roleLabel && display.creators ? <> ({roleLabel})</> : null}
                              <> {`(${displayYear}).`}</>
                              {display.title ? <> {display.title}.</> : <> {common('referenceUntitled')}.</>}
                            </p>

                            {display.container || display.secondary.length || display.accessed ? (
                              <div className="flex min-w-0 flex-col gap-1 text-sm leading-6 text-muted-foreground">
                                {display.container ? <p>{display.container}</p> : null}
                                {display.secondary.map((segment) => (
                                  <p key={segment}>{segment}</p>
                                ))}
                                {display.accessed ? (
                                  <p>{common('referenceAccessed', { date: display.accessed })}</p>
                                ) : null}
                              </div>
                            ) : null}

                            {display.links.length ? (
                              <div className="flex flex-wrap gap-2">
                                {display.links.map((link) => (
                                  <a
                                    className="text-xs uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
                                    href={link.href}
                                    key={`${entry.citationKey}-${link.label}`}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    {link.label}: {link.value}
                                  </a>
                                ))}
                              </div>
                            ) : null}

                            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {entry.citationKey} · {typeLabel}
                              {roleLabel ? ` · ${roleLabel}` : ''} ·{' '}
                              {getLocaleLabel(resolved.resolvedLocale)}
                            </span>
                          </div>
                        </li>
                      )
                    })()
                  ))}
                </ol>
              </section>
            ) : null}
          </aside>
        ) : null}
      </article>
    </div>
  )
}
