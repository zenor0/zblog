import Link from 'next/link'

import { estimateReadingTime, formatLongDate } from '@/app/(frontend)/helpers'
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
  exitHref: string
}) {
  const { exitHref } = props

  return (
    <div className="notice notice--preview">
      <strong>Preview mode:</strong> you are viewing the draft version of this article as it would
      render on the frontend. <Link href={exitHref}>Exit preview</Link>
    </div>
  )
}

function TranslationNotice(props: {
  locale: string
  requestedLocale: string
  resolvedLocale: string
  translatedFromLocale?: string | null
  translationStatus?: string | null
  usedFallback: boolean
}) {
  const { locale, requestedLocale, resolvedLocale, translatedFromLocale, translationStatus, usedFallback } =
    props

  if (usedFallback) {
    return (
      <div className="notice notice--warning">
        <strong>Fallback locale:</strong> the <code>{requestedLocale}</code> version is incomplete, so
        this page is rendering the <code>{resolvedLocale}</code> source instead.
      </div>
    )
  }

  if (translationStatus === 'machine') {
    return (
      <div className="notice notice--info">
        <strong>Machine translation:</strong> this <code>{locale}</code> page was generated from{' '}
        <code>{translatedFromLocale ?? resolvedLocale}</code>. Review before treating it as canonical.
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
  const heroImage = post.heroImage && typeof post.heroImage === 'object' ? post.heroImage : null
  const attachments = (post.attachments ?? []).filter(
    (item) => item.file && typeof item.file === 'object' && item.file.url,
  )
  const displayTitle =
    typeof post.title === 'string' && post.title.trim().length > 0
      ? post.title
      : usedDraftAccess
        ? 'Untitled draft'
        : 'Untitled post'
  const exitPreviewHref = buildExitPreviewURL(previewExitPath)

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
            <span>{formatLongDate(post.publishedAt ?? post.updatedAt, resolved.resolvedLocale)}</span>
            <span>{estimateReadingTime(post.content)}</span>
            {historyHref ? <Link href={historyHref}>Version history</Link> : null}
          </div>
          <h1>{displayTitle}</h1>
          {post.excerpt ? <p className="lede">{post.excerpt}</p> : null}
          {usedDraftAccess ? <PreviewNotice exitHref={exitPreviewHref} /> : null}
          <TranslationNotice
            locale={locale}
            requestedLocale={resolved.requestedLocale}
            resolvedLocale={resolved.resolvedLocale}
            translatedFromLocale={sourcePost?.translatedFromLocale}
            translationStatus={sourcePost?.translationStatus}
            usedFallback={usedFallback}
          />
          {missingCitationKeys.length > 0 ? (
            <div className="notice notice--danger">
              <strong>Bibliography mismatch:</strong> missing citation keys{' '}
              {missingCitationKeys.map((key) => (
                <code key={key}>{key}</code>
              ))}
            </div>
          ) : null}
        </header>

        {heroImage?.url ? (
          <figure className="hero-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={heroImage.alt} src={heroImage.url} />
            {heroImage.caption || heroImage.credit ? (
              <figcaption>
                {heroImage.caption}
                {heroImage.caption && heroImage.credit ? ' · ' : null}
                {heroImage.credit}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="content-grid">
          <section className="content-card">
            <div className="markdown prose-shell">
              <MarkdownRenderer citationIndex={citationIndex} source={post.content} />
            </div>
          </section>

          <aside className="sidebar-stack">
            {post.tags?.length ? (
              <section className="side-card">
                <h2>Tags</h2>
                <ul className="tag-list">
                  {post.tags.map((tag) => (
                    <li key={tag.id ?? tag.value}>{tag.value}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {attachments.length ? (
              <section className="side-card">
                <h2>Attachments</h2>
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
                <h2>References</h2>
                <ol className="reference-list">
                  {bibliographyEntries.map((entry, index) => (
                    <li id={`reference-${index + 1}`} key={entry.citationKey}>
                      <span className="reference-index">[{index + 1}]</span>
                      <div>
                        <p>{entry.formatted}</p>
                        <span className="reference-meta">
                          {entry.citationKey} · {entry.entryType || 'reference'} ·{' '}
                          {getLocaleLabel(resolved.resolvedLocale)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </aside>
        </div>
      </article>
    </div>
  )
}
