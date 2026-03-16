import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { estimateReadingMinutes, formatLongDate } from '@/i18n/format'
import type { ResolvedPost } from '@/lib/posts'
import { getLocaleLabel, type AppLocale } from '@/lib/locales'
import { MarkdownRenderer } from '@/lib/markdown'
import { buildExitPreviewURL } from '@/lib/preview'

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
    <div className="notice notice--preview">
      <strong>{title}:</strong> {body} <Link href={exitHref}>{exitLabel}</Link>
    </div>
  )
}

function TranslationNotice(props: {
  message: string
  title: string
  tone: 'info' | 'warning'
}) {
  const { message, title, tone } = props

  return (
    <div className={`notice notice--${tone}`}>
      <strong>{title}:</strong> {message}
    </div>
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
    usedDraftAccess || Boolean(fallbackMessage) || Boolean(machineTranslationMessage) || missingCitationKeys.length > 0

  return (
    <div className="page-shell">
      <div className="page-topbar">
        <Link className="back-link" href={backHref}>
          {backLabel}
        </Link>
        <nav aria-label={common('localeNavigation')} className="locale-nav">
          {localeLinks.map((item) => (
            <Link
              className={item.locale === locale ? 'locale-pill locale-pill--active' : 'locale-pill'}
              href={item.href}
              key={item.locale}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <article className="post-layout">
        <header className="post-header">
          <div className="meta-row">
            <span className="meta-pill">
              {formatLongDate({
                fallback: common('unscheduled'),
                locale: resolved.resolvedLocale,
                value: post.publishedAt ?? post.updatedAt,
              })}
            </span>
            <span className="meta-pill">
              {article('readingTime', {
                minutes: estimateReadingMinutes(post.content),
              })}
            </span>
            {historyHref ? (
              <Link className="meta-pill meta-pill--link" href={historyHref}>
                {article('versionHistory')}
              </Link>
            ) : null}
          </div>
          <h1>{displayTitle}</h1>
          {post.excerpt ? <p className="lede">{post.excerpt}</p> : null}
          {showNotices ? (
            <div className="notice-stack">
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
                <div className="notice notice--danger">
                  <strong>{article('bibliographyMismatchTitle')}:</strong>{' '}
                  {article('bibliographyMismatchIntro')}{' '}
                  {missingCitationKeys.map((key, index) => (
                    <span key={key}>
                      {index > 0 ? ' ' : null}
                      <code>{key}</code>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        {heroImage?.url ? (
          <figure className="hero-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={heroImage.alt || displayTitle} src={heroImage.url} />
            {heroImage.caption || heroImage.credit ? (
              <figcaption>
                {heroImage.caption}
                {heroImage.caption && heroImage.credit ? ' · ' : null}
                {heroImage.credit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className={hasSidebar ? 'content-grid' : 'content-grid content-grid--single'}>
          <section className="content-card">
            <div className="markdown prose-shell">
              <MarkdownRenderer citationIndex={citationIndex} source={post.content} />
            </div>
          </section>

          {hasSidebar ? (
            <aside className="sidebar-stack">
              {post.tags?.length ? (
                <section className="side-card">
                  <h2>{common('tags')}</h2>
                  <ul className="tag-list">
                    {post.tags.map((tag) => (
                      <li key={tag.id ?? tag.value}>{tag.value}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {attachments.length ? (
                <section className="side-card">
                  <h2>{common('attachments')}</h2>
                  <ul className="link-list">
                    {attachments.map((attachment) => {
                      const file = attachment.file as Exclude<typeof attachment.file, number>

                      return (
                        <li key={attachment.id ?? file.id}>
                          <a href={file.url ?? '#'} rel="noreferrer" target="_blank">
                            {attachment.label || file.filename || file.alt}
                          </a>
                          {attachment.description ? <p>{attachment.description}</p> : null}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null}

              {bibliographyEntries.length ? (
                <section className="side-card">
                  <h2>{common('references')}</h2>
                  <ol className="reference-list">
                    {bibliographyEntries.map((entry, index) => (
                      <li id={`reference-${index + 1}`} key={entry.citationKey}>
                        <span className="reference-index">[{index + 1}]</span>
                        <div>
                          <p>{entry.formatted}</p>
                          <span className="reference-meta">
                            {entry.citationKey} · {entry.entryType || common('referenceItem')} ·{' '}
                            {getLocaleLabel(resolved.resolvedLocale)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </aside>
          ) : null}
        </div>
      </article>
    </div>
  )
}
