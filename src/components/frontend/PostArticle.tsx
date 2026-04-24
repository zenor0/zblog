import Link from 'next/link'
import {
  ArrowLeftIcon,
  FileWarningIcon,
  LanguagesIcon,
  SparklesIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { CollapsibleReferenceSection } from '@/components/frontend/CollapsibleReferenceSection'
import { MediaDetails } from '@/components/frontend/MediaDetails'
import { LocaleSwitcher } from '@/components/frontend/LocaleSwitcher'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { PostTableOfContents } from '@/components/frontend/PostTableOfContents'
import { ThemeSwitcher } from '@/components/frontend/ThemeSwitcher'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { describeBibliographyEntry } from '@/lib/bibliography'
import { extractMarkdownMediaSources, MarkdownRenderer } from '@/lib/markdown'
import { extractMarkdownHeadings } from '@/lib/markdown-headings'
import { resolveAttachmentDescription, resolveMediaAsset, resolveMediaCaption } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import type { ResolvedPost } from '@/lib/posts'
import { getLocaleLabel, type AppLocale } from '@/lib/locales'
import { buildExitPreviewURL } from '@/lib/preview'
import { cn } from '@/lib/utils'
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
  const allHeadings = extractMarkdownHeadings(post.content)
  const markdownMediaSources = extractMarkdownMediaSources(post.content)
  const markdownMediaBySource =
    markdownMediaSources.length > 0
      ? Object.fromEntries(
          (
            await (
              await getPayloadClient()
            ).find({
              collection: 'media',
              depth: 0,
              limit: markdownMediaSources.length,
              overrideAccess: false,
              select: {
                alt: true,
                caption: true,
                credit: true,
                filename: true,
                height: true,
                mimeType: true,
                previewSVGURL: true,
                url: true,
                width: true,
              },
              where: {
                url: {
                  in: markdownMediaSources,
                },
              },
            })
          ).docs
            .filter((media) => typeof media.url === 'string' && media.url.length > 0)
            .map((media) => [media.url as string, media]),
        )
      : {}
  const tocHeadings = allHeadings.filter((heading) => heading.depth >= 2 && heading.depth <= 4)
  const hasSupplementaryContent = Boolean(
    post.tags?.length || attachments.length || bibliographyEntries.length,
  )
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
        className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between"
        data-embedded-hidden="true"
      >
        <Link
          className="editorial-meta inline-flex w-fit items-center gap-2 transition-colors hover:text-foreground"
          href={backHref}
        >
          <ArrowLeftIcon className="size-4" />
          {backLabel}
        </Link>

        <div className="flex items-center justify-end gap-2">
          <ThemeSwitcher
            label={common('themeNavigation')}
            labels={{
              auto: common('themeAuto'),
              dark: common('themeDark'),
              light: common('themeLight'),
            }}
          />
          <LocaleSwitcher
            activeLocale={locale}
            items={localeLinks}
            label={common('localeNavigation')}
          />
        </div>
      </div>

      <article
        className={cn(
          'grid gap-10',
          tocHeadings.length > 0 && 'xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10',
        )}
        data-article-layout=""
      >
        <div className="flex min-w-0 flex-col gap-8" data-article-reading-column="">
          <header
            className="flex flex-col gap-6 border-b border-border pb-10"
            data-article-frontmatter=""
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>
                {formatLongDate({
                  fallback: common('unscheduled'),
                  locale: resolved.resolvedLocale,
                  value: post.publishedAt ?? post.updatedAt,
                })}
              </span>
              <span>
                {article('readingTime', { minutes: estimateReadingMinutes(post.content) })}
              </span>
              <span>{getLocaleLabel(resolved.resolvedLocale)}</span>
              {historyHref ? (
                <Link className="editorial-link no-underline" href={historyHref}>
                  {article('versionHistory')}
                </Link>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <p className="section-kicker">
                {usedDraftAccess ? article('previewTitle') : common('publishedLabel')}
              </p>
              <h1 className="max-w-4xl font-serif text-5xl leading-none tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                {displayTitle}
              </h1>
              {post.excerpt ? (
                <p className="max-w-3xl text-base leading-8 text-foreground/72 sm:text-lg">
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
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {missingCitationKeys.map((key) => (
                        <span key={key}>{key}</span>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          {heroImage?.url ? (
            <figure className="flex flex-col gap-3 border-b border-border pb-10">
              <MediaSurface
                alt={heroImage.alt || displayTitle}
                loading="eager"
                media={heroImage}
                variant="hero"
              />
              <MediaDetails
                caption={resolveMediaCaption({
                  alt: heroImage.alt || displayTitle,
                  caption: heroImage.caption,
                })}
                className="px-1"
                credit={heroImage.credit}
                creditPrefix={common('mediaCredit')}
              />
            </figure>
          ) : null}

          <section className="article-copy" data-article-body="" data-post-reading-root="">
            <MarkdownRenderer
              articleReferenceLabels={{
                fig: common('figureLabel'),
                tbl: common('tableLabel'),
              }}
              citationIndex={citationIndex}
              headings={allHeadings}
              mediaBySource={markdownMediaBySource}
              source={post.content}
            />
          </section>

          {hasSupplementaryContent ? (
            <div
              className="flex flex-col gap-10 border-t border-border pt-10"
              data-article-supplementary=""
            >
              {post.tags?.length ? (
                <section className="flex flex-col gap-3">
                  <p className="section-kicker">{common('tags')}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {post.tags.map((tag) => (
                      <span key={tag.id ?? tag.value}>{tag.value}</span>
                    ))}
                  </div>
                </section>
              ) : null}

              {attachments.length ? (
                <section className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="section-kicker">{common('attachments')}</p>
                    <h2 className="font-serif text-2xl tracking-[-0.02em] text-foreground">
                      {common('attachments')}
                    </h2>
                  </div>
                  <div className="flex flex-col divide-y divide-border">
                    {attachments.map((attachment) => {
                      const file = attachment.file as Exclude<typeof attachment.file, number>
                      const asset = resolveMediaAsset({
                        alt: attachment.label || file.alt || file.filename,
                        media: file,
                      })
                      const attachmentDescription = resolveAttachmentDescription({
                        caption: file.caption,
                        description: attachment.description,
                      })
                      const typeLabel =
                        asset?.kind === 'pdf' ? 'PDF' : asset?.extensionLabel || 'FILE'

                      return (
                        <a
                          className="group grid gap-4 py-4 transition-colors hover:text-foreground sm:grid-cols-[7rem_minmax(0,1fr)]"
                          href={file.url ?? '#'}
                          key={attachment.id ?? file.id}
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
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              <span>{typeLabel}</span>
                              {file.filename ? (
                                <span className="truncate">{file.filename}</span>
                              ) : null}
                            </span>
                            <span className="font-serif text-xl tracking-[-0.02em] text-foreground">
                              {attachment.label || file.filename || file.alt}
                            </span>
                            <MediaDetails
                              caption={attachmentDescription}
                              credit={file.credit}
                              creditPrefix={common('mediaCredit')}
                            />
                          </span>
                        </a>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              {bibliographyEntries.length ? (
                <section className="flex flex-col gap-3">
                  <p className="section-kicker">{common('references')}</p>
                  <CollapsibleReferenceSection
                    countLabel={article('referencesCount', { count: bibliographyEntries.length })}
                    label={common('references')}
                  >
                    <ol className="flex flex-col">
                      {bibliographyEntries.map((entry, index) =>
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
                              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b py-2.5 last:border-b-0"
                              id={`reference-${index + 1}`}
                              key={entry.citationKey}
                            >
                              <span className="pt-0.5 text-xs font-medium text-muted-foreground">
                                [{index + 1}]
                              </span>
                              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <p className="min-w-0 text-sm leading-6 text-foreground/82 wrap-anywhere">
                                  {display.creators ? <>{display.creators}</> : null}
                                  {roleLabel && display.creators ? <> ({roleLabel})</> : null}
                                  <> {`(${displayYear}).`}</>
                                  {display.title ? (
                                    <> {display.title}.</>
                                  ) : (
                                    <> {common('referenceUntitled')}.</>
                                  )}
                                </p>

                                {display.container ||
                                display.secondary.length ||
                                display.accessed ? (
                                  <div className="flex min-w-0 flex-col gap-0.5 text-[13px] leading-5 text-muted-foreground">
                                    {[display.container, ...display.secondary]
                                      .filter((segment): segment is string => Boolean(segment))
                                      .map((segment, segmentIndex) => (
                                        <p
                                          className="wrap-anywhere"
                                          key={`${entry.citationKey}-${segmentIndex}`}
                                        >
                                          {segment}
                                        </p>
                                      ))}
                                    {display.accessed ? (
                                      <p className="wrap-anywhere">
                                        {common('referenceAccessed', { date: display.accessed })}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}

                                {display.links.length ? (
                                  <p className="min-w-0 text-[13px] leading-5 text-muted-foreground">
                                    {display.links.map((link, linkIndex) => (
                                      <span key={`${entry.citationKey}-${link.label}`}>
                                        {linkIndex > 0 ? (
                                          <span className="px-1.5 text-border">·</span>
                                        ) : null}
                                        <a
                                          className="editorial-link wrap-anywhere no-underline"
                                          href={link.href}
                                          rel="noreferrer"
                                          target="_blank"
                                        >
                                          <span className="text-muted-foreground">
                                            {link.label}:
                                          </span>{' '}
                                          {link.value}
                                        </a>
                                      </span>
                                    ))}
                                  </p>
                                ) : null}

                                <span className="min-w-0 text-[11px] leading-4 tracking-[0.12em] text-muted-foreground/85 wrap-anywhere">
                                  {entry.citationKey} · {typeLabel}
                                  {roleLabel ? ` · ${roleLabel}` : ''} ·{' '}
                                  {getLocaleLabel(resolved.resolvedLocale)}
                                </span>
                              </div>
                            </li>
                          )
                        })(),
                      )}
                    </ol>
                  </CollapsibleReferenceSection>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>

        {tocHeadings.length ? (
          <aside className="xl:sticky xl:top-8 xl:self-start">
            <PostTableOfContents
              headings={tocHeadings}
              label={article('tableOfContents')}
              progressLabel={article('readingProgress')}
            />
          </aside>
        ) : null}
      </article>
    </div>
  )
}
