import Link from 'next/link'

import { estimateReadingTime, formatLongDate, getFrontendCopy } from '@/app/(frontend)/helpers'
import type { ResolvedPost } from '@/lib/posts'
import { getLocaleLabel, type AppLocale } from '@/lib/locales'
import { MarkdownRenderer } from '@/lib/markdown'
import { buildExitPreviewURL } from '@/lib/preview'

type LocaleLink = {
  href: string
  label: string
  locale: AppLocale
}

type FrontendCopy = ReturnType<typeof getFrontendCopy>

function PreviewNotice(props: {
  copy: FrontendCopy
  exitHref: string
}) {
  const { copy, exitHref } = props

  return (
    <div className="notice notice--preview">
      <strong>{copy.previewTitle}:</strong> {copy.previewBody} <Link href={exitHref}>{copy.exitPreview}</Link>
    </div>
  )
}

function TranslationNotice(props: {
  copy: FrontendCopy
  locale: string
  requestedLocale: string
  resolvedLocale: string
  translatedFromLocale?: string | null
  translationStatus?: string | null
  usedFallback: boolean
}) {
  const {
    copy,
    locale,
    requestedLocale,
    resolvedLocale,
    translatedFromLocale,
    translationStatus,
    usedFallback,
  } = props

  if (usedFallback) {
    return (
      <div className="notice notice--warning">
        <strong>{copy.fallbackTitle}:</strong> {copy.fallbackBeforeRequested}
        <code>{requestedLocale}</code>
        {copy.fallbackBetweenLocales}
        <code>{resolvedLocale}</code>
        {copy.fallbackAfterResolved}
      </div>
    )
  }

  if (translationStatus === 'machine') {
    return (
      <div className="notice notice--info">
        <strong>{copy.machineTranslationTitle}:</strong> {copy.machineTranslationBeforeLocale}
        <code>{locale}</code>
        {copy.machineTranslationBetweenLocales}
        <code>{translatedFromLocale ?? resolvedLocale}</code>
        {copy.machineTranslationAfterSource}
      </div>
    )
  }

  return null
}

export function PostArticle(props: {
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
  const copy = getFrontendCopy(locale)
  const heroImage = post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null
  const attachments = (post.attachments ?? []).filter(
    (item) => item.file && typeof item.file === 'object' && item.file.url,
  )
  const hasSidebar = Boolean(post.tags?.length || attachments.length || bibliographyEntries.length)
  const displayTitle =
    typeof post.title === 'string' && post.title.trim().length > 0
      ? post.title
      : usedDraftAccess
        ? copy.untitledDraft
        : copy.untitledPost
  const exitPreviewHref = buildExitPreviewURL(previewExitPath)
  const showNotices =
    usedDraftAccess ||
    usedFallback ||
    sourcePost?.translationStatus === 'machine' ||
    missingCitationKeys.length > 0

  return (
    <div className="page-shell">
      <div className="page-topbar">
        <Link className="back-link" href={backHref}>
          {backLabel}
        </Link>
        <nav aria-label="Locales" className="locale-nav">
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
              {formatLongDate(post.publishedAt ?? post.updatedAt, resolved.resolvedLocale)}
            </span>
            <span className="meta-pill">{estimateReadingTime(post.content, locale)}</span>
            {historyHref ? (
              <Link className="meta-pill meta-pill--link" href={historyHref}>
                {copy.versionHistory}
              </Link>
            ) : null}
          </div>
          <h1>{displayTitle}</h1>
          {post.excerpt ? <p className="lede">{post.excerpt}</p> : null}
          {showNotices ? (
            <div className="notice-stack">
              {usedDraftAccess ? <PreviewNotice copy={copy} exitHref={exitPreviewHref} /> : null}
              <TranslationNotice
                copy={copy}
                locale={locale}
                requestedLocale={resolved.requestedLocale}
                resolvedLocale={resolved.resolvedLocale}
                translatedFromLocale={sourcePost?.translatedFromLocale}
                translationStatus={sourcePost?.translationStatus}
                usedFallback={usedFallback}
              />
              {missingCitationKeys.length > 0 ? (
                <div className="notice notice--danger">
                  <strong>{copy.bibliographyMismatchTitle}:</strong> {copy.bibliographyMismatchIntro}{' '}
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
                  <h2>{copy.tags}</h2>
                  <ul className="tag-list">
                    {post.tags.map((tag) => (
                      <li key={tag.id ?? tag.value}>{tag.value}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {attachments.length ? (
                <section className="side-card">
                  <h2>{copy.attachments}</h2>
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
                  <h2>{copy.references}</h2>
                  <ol className="reference-list">
                    {bibliographyEntries.map((entry, index) => (
                      <li id={`reference-${index + 1}`} key={entry.citationKey}>
                        <span className="reference-index">[{index + 1}]</span>
                        <div>
                          <p>{entry.formatted}</p>
                          <span className="reference-meta">
                            {entry.citationKey} · {entry.entryType || copy.referenceItem} ·{' '}
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
