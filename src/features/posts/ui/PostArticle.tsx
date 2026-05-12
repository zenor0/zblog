import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { ArticleAnchorNavigation } from '@/features/article/ui/ArticleAnchorNavigation'
import { ArticleViewTracker } from '@/features/post-views/ui/ArticleViewTracker'
import { MediaDetails } from '@/features/media/ui/MediaDetails'
import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { MediaSurface } from '@/features/media/ui/MediaSurface'
import { ArticleTableOfContents } from '@/features/article/ui/ArticleTableOfContents'
import { PostArticleNotices } from '@/features/posts/ui/PostArticleNotices'
import { PostArticleSupplementary } from '@/features/posts/ui/PostArticleSupplementary'
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher'
import { buildBibliographyLinkPreviews } from '@/features/article/model/article-link-previews'
import { extractMarkdownMediaSources, MarkdownRenderer } from '@/features/article/markdown'
import type { MarkdownMediaLike } from '@/features/article/markdown/types'
import {
  extractMarkdownHeadings,
  type MarkdownHeading,
} from '@/features/article/model/markdown-headings'
import type { ArticleTocVariantID } from '@/features/frontend-variants/model/frontend-variants'
import { resolveMediaCaption } from '@/features/media/model/media'
import { getPayloadClient } from '@/shared/payload/client'
import type { ResolvedPost } from '@/features/posts/server/queries'
import { getLocaleLabel, type AppLocale } from '@/shared/i18n/locales'
import { buildExitPreviewURL } from '@/features/posts/preview'
import { cn } from '@/shared/utils/cn'
import { estimateReadingMinutes, formatLongDate } from '@/i18n/format'

type LocaleLink = {
  href: string
  label: string
  locale: AppLocale
}

async function loadMarkdownMediaBySource(
  sources: string[],
): Promise<Record<string, MarkdownMediaLike>> {
  if (sources.length === 0) {
    return {}
  }

  const payload = await getPayloadClient()
  const media = await payload.find({
    collection: 'media',
    depth: 0,
    limit: sources.length,
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
        in: sources,
      },
    },
  })

  return Object.fromEntries(
    media.docs
      .filter((item) => typeof item.url === 'string' && item.url.length > 0)
      .map((item) => [item.url as string, item]),
  )
}

export async function PostArticle(props: {
  articleTocVariant?: ArticleTocVariantID
  backHref: string
  backLabel: string
  historyHref?: null | string
  locale: AppLocale
  localeLinks: LocaleLink[]
  markdownMediaBySource?: Record<string, MarkdownMediaLike>
  previewExitPath: string
  renderTableOfContents?: (args: {
    headings: MarkdownHeading[]
    label: string
    progressLabel: string
  }) => ReactNode
  resolved: ResolvedPost
  shouldTrackView?: boolean
  viewCount?: number
}) {
  const {
    articleTocVariant = 'standard',
    backHref,
    backLabel,
    historyHref,
    locale,
    localeLinks,
    markdownMediaBySource: markdownMediaBySourceOverrides = {},
    previewExitPath,
    renderTableOfContents,
    resolved,
    shouldTrackView = false,
    viewCount = 0,
  } = props
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
  const allHeadings = extractMarkdownHeadings(post.content)
  const markdownMediaSources = extractMarkdownMediaSources(post.content)
  const markdownMediaSourcesToFetch = markdownMediaSources.filter(
    (source) => !markdownMediaBySourceOverrides[source],
  )
  const fetchedMarkdownMediaBySource = await loadMarkdownMediaBySource(markdownMediaSourcesToFetch)
  const markdownMediaBySource = {
    ...fetchedMarkdownMediaBySource,
    ...markdownMediaBySourceOverrides,
  }
  const tocHeadings = allHeadings.filter((heading) => heading.depth >= 2 && heading.depth <= 4)
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
  const bibliographyLinkPreviews = buildBibliographyLinkPreviews(bibliographyEntries, {
    referenceItem: common('referenceItem'),
    referenceUntitled: common('referenceUntitled'),
    references: common('references'),
  })
  return (
    <div className="page-frame frontend-shell">
      <ArticleAnchorNavigation returnLabel={article('returnToReadingPosition')} />
      {shouldTrackView ? (
        <ArticleViewTracker locale={resolved.resolvedLocale} postId={post.id} />
      ) : null}
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
            <div className="editorial-meta flex flex-wrap items-center gap-x-4 gap-y-2">
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
              <span>{article('viewCount', { count: viewCount })}</span>
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
              <h1 className="max-w-4xl font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
                {displayTitle}
              </h1>
              {post.excerpt ? (
                <p className="max-w-3xl text-base leading-8 text-foreground/72 sm:text-lg">
                  {post.excerpt}
                </p>
              ) : null}
            </div>
          </header>

          <PostArticleNotices
            bibliographyMismatch={
              missingCitationKeys.length > 0
                ? {
                    intro: article('bibliographyMismatchIntro'),
                    keys: missingCitationKeys,
                    title: article('bibliographyMismatchTitle'),
                  }
                : null
            }
            fallback={
              fallbackMessage
                ? {
                    message: fallbackMessage,
                    title: article('fallbackTitle'),
                  }
                : null
            }
            machineTranslation={
              machineTranslationMessage
                ? {
                    message: machineTranslationMessage,
                    title: article('machineTranslationTitle'),
                  }
                : null
            }
            preview={
              usedDraftAccess
                ? {
                    body: article('previewBody'),
                    exitHref: exitPreviewHref,
                    exitLabel: article('exitPreview'),
                    title: article('previewTitle'),
                  }
                : null
            }
          />

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
              bibliographyPreviewsByKey={bibliographyLinkPreviews.byKey}
              citationIndex={citationIndex}
              headings={allHeadings}
              mediaBySource={markdownMediaBySource}
              source={post.content}
            />
          </section>

          <PostArticleSupplementary
            attachments={post.attachments}
            bibliographyEntries={bibliographyEntries}
            labels={{
              attachments: common('attachments'),
              mediaCredit: common('mediaCredit'),
              referenceItem: common('referenceItem'),
              referenceNoDate: common('referenceNoDate'),
              referenceRoleEditor: common('referenceRoleEditor'),
              referenceRoleTranslator: common('referenceRoleTranslator'),
              references: common('references'),
              referenceUntitled: common('referenceUntitled'),
              tags: common('tags'),
            }}
            referenceAccessedLabel={(date) => common('referenceAccessed', { date })}
            referencesCountLabel={article('referencesCount', { count: bibliographyEntries.length })}
            resolvedLocale={resolved.resolvedLocale}
            tags={post.tags}
          />
        </div>

        {tocHeadings.length ? (
          <aside className="xl:sticky xl:top-8 xl:self-start">
            {renderTableOfContents ? (
              renderTableOfContents({
                headings: tocHeadings,
                label: article('tableOfContents'),
                progressLabel: article('readingProgress'),
              })
            ) : (
              <ArticleTableOfContents
                headings={tocHeadings}
                label={article('tableOfContents')}
                progressLabel={article('readingProgress')}
                variant={articleTocVariant}
              />
            )}
          </aside>
        ) : null}
      </article>
    </div>
  )
}
