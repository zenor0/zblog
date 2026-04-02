import type { Post } from '@/payload-types'
import type { AppLocale } from '@/lib/locales'
import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { defaultLocale, normalizeLocale, supportedLocales } from '@/lib/locales'
import {
  buildContentAssetSummary,
  buildPublishingSnapshot,
  formatStatus,
  getCoverageBadgeLabel,
  getCoverageTone,
  getHeroImage,
  getLocaleCoverage,
  getLocaleNote,
  getPreviewURL,
  getStatusTone,
  summarizeLocaleCoverage,
  type LocaleInsight,
  type LocaleSnapshot,
} from '@/components/payload/postOverviewSummary'

import './post-insights.scss'

type RelatedSummary = Pick<
  Post,
  | '_status'
  | 'attachments'
  | 'bibliographyFile'
  | 'content'
  | 'excerpt'
  | 'heroImage'
  | 'seo'
  | 'slug'
  | 'tags'
  | 'title'
  | 'updatedAt'
>

type ResourceSummary = {
  bibliographyFiles: number
  media: number
}

function getAccessOverride(reqUser: unknown) {
  return reqUser ? ({ overrideAccess: false as const } as const) : {}
}

function buildLocalRequest(args: {
  locale?: AppLocale
  req: UIFieldServerProps['req']
}): Partial<UIFieldServerProps['req']> {
  const localReq: Partial<UIFieldServerProps['req']> = {}

  if (args.locale) {
    localReq.locale = args.locale
  }

  if (args.req.user) {
    localReq.user = args.req.user
  }

  return localReq
}

async function loadLocaleSnapshot(args: {
  id: number | string
  locale: AppLocale
  req: UIFieldServerProps['req']
}): Promise<LocaleSnapshot | null> {
  return args.req.payload.findByID({
    collection: 'posts',
    depth: 0,
    draft: true,
    fallbackLocale: false,
    id: args.id,
    locale: args.locale,
    req: buildLocalRequest({
      locale: args.locale,
      req: args.req,
    }),
    select: {
      content: true,
      title: true,
      translatedAt: true,
      translatedFromLocale: true,
      translationStatus: true,
    },
    user: args.req.user,
    ...getAccessOverride(args.req.user),
  })
}

async function loadRelatedSummary(args: {
  activeLocale: AppLocale
  id: number | string
  req: UIFieldServerProps['req']
}): Promise<RelatedSummary | null> {
  return args.req.payload.findByID({
    collection: 'posts',
    depth: 1,
    draft: true,
    fallbackLocale: false,
    id: args.id,
    locale: args.activeLocale,
    req: buildLocalRequest({
      locale: args.activeLocale,
      req: args.req,
    }),
    select: {
      _status: true,
      attachments: true,
      bibliographyFile: true,
      content: true,
      excerpt: true,
      heroImage: true,
      seo: true,
      slug: true,
      tags: true,
      title: true,
      updatedAt: true,
    },
    user: args.req.user,
    ...getAccessOverride(args.req.user),
  })
}

async function loadResourceSummary(args: {
  id: number | string
  req: UIFieldServerProps['req']
}): Promise<ResourceSummary> {
  const [bibliographyFiles, media] = await Promise.all([
    args.req.payload.find({
      collection: 'bibliography-files',
      depth: 0,
      limit: 1,
      page: 1,
      req: buildLocalRequest({
        req: args.req,
      }),
      user: args.req.user,
      where: {
        ownerPost: {
          equals: args.id,
        },
      },
      ...getAccessOverride(args.req.user),
    }),
    args.req.payload.find({
      collection: 'media',
      depth: 0,
      limit: 1,
      page: 1,
      req: buildLocalRequest({
        req: args.req,
      }),
      user: args.req.user,
      where: {
        ownerPost: {
          equals: args.id,
        },
      },
      ...getAccessOverride(args.req.user),
    }),
  ])

  return {
    bibliographyFiles: bibliographyFiles.totalDocs,
    media: media.totalDocs,
  }
}

export const PostInsights: UIFieldServerComponent = async ({ id, req }) => {
  if (typeof id !== 'number' && typeof id !== 'string') {
    return (
      <section className="post-insights">
        <div className="post-insights__empty">
          <h3>Post overview</h3>
          <p>Save this post first to inspect locale coverage, publishing status, and linked resources.</p>
        </div>
      </section>
    )
  }

  const activeLocale =
    normalizeLocale(typeof req.locale === 'string' ? req.locale : undefined) ?? defaultLocale

  const [locales, references, resources] = await Promise.all([
    Promise.all(
      supportedLocales.map(async (locale) => {
        const snapshot = await loadLocaleSnapshot({
          id,
          locale: locale.code,
          req,
        })

        return {
          code: locale.code,
          coverage: getLocaleCoverage(snapshot),
          label: locale.label,
          snapshot,
        } satisfies LocaleInsight
      }),
    ),
    loadRelatedSummary({
      activeLocale,
      id,
      req,
    }),
    loadResourceSummary({
      id,
      req,
    }),
  ])

  const activeLocaleInsight = locales.find((locale) => locale.code === activeLocale) ?? null
  const heroImage = getHeroImage(references?.heroImage)
  const heroPreviewURL = getPreviewURL(heroImage)
  const localeSummary = summarizeLocaleCoverage(locales)
  const publishingSnapshot = buildPublishingSnapshot({
    activeLocale,
    content: activeLocaleInsight?.snapshot?.content ?? references?.content ?? null,
    excerpt: references?.excerpt ?? null,
    heroImage: references?.heroImage ?? null,
    seo: references?.seo ?? null,
    slug: references?.slug ?? null,
    status: references?._status ?? null,
    title: activeLocaleInsight?.snapshot?.title ?? references?.title ?? null,
    translationStatus: activeLocaleInsight?.snapshot?.translationStatus ?? null,
    updatedAt: references?.updatedAt ?? null,
  })
  const contentAssets = buildContentAssetSummary({
    attachments: references?.attachments ?? null,
    bibliographyFile: references?.bibliographyFile ?? null,
    heroImage: references?.heroImage ?? null,
    tags: references?.tags ?? null,
  })
  const totalOwnedResources = resources.bibliographyFiles + resources.media

  return (
    <section className="post-insights">
      <section className="post-insights__section">
        <header className="post-insights__section-header">
          <div>
            <h3>Publishing snapshot</h3>
            <p>Fast checks for the active locale before you edit or publish.</p>
          </div>
        </header>

        <div className="post-insights__snapshot-grid">
          {Object.entries(publishingSnapshot).map(([key, item]) => (
            <article
              className={`post-insights__snapshot-card post-insights__snapshot-card--${item.tone}`}
              key={key}
            >
              <span className="post-insights__snapshot-label">{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="post-insights__section">
        <header className="post-insights__section-header">
          <div>
            <h3>Locale coverage</h3>
            <p>Saved draft snapshots for each locale, optimized for quick scanning.</p>
          </div>
          <div className="post-insights__summary-strip">
            <span className="post-insights__summary-pill">{localeSummary.completeCount} complete</span>
            <span className="post-insights__summary-pill">{localeSummary.partialCount} partial</span>
            <span className="post-insights__summary-pill">{localeSummary.missingCount} missing</span>
            <span className="post-insights__summary-pill">{localeSummary.reviewedCount} reviewed</span>
          </div>
        </header>

        <ul className="post-insights__locale-list">
          {locales.map(({ code, coverage, label, snapshot }) => {
            const localeNote = getLocaleNote(snapshot, activeLocale)

            return (
              <li className="post-insights__locale-row" key={code}>
                <div className="post-insights__locale-copy">
                  <strong>{label}</strong>
                  {localeNote ? <span className="post-insights__locale-note">{localeNote}</span> : null}
                </div>

                <div className="post-insights__badge-row">
                  {snapshot?.translationStatus === 'original' ? (
                    <span className="post-insights__badge post-insights__badge--source">
                      Source locale
                    </span>
                  ) : null}
                  <span
                    className={`post-insights__badge post-insights__badge--${getCoverageTone(coverage)}`}
                  >
                    {getCoverageBadgeLabel(snapshot)}
                  </span>
                  <span
                    className={`post-insights__badge post-insights__badge--${getStatusTone(
                      snapshot?.translationStatus,
                    )}`}
                  >
                    {formatStatus(snapshot?.translationStatus)}
                  </span>
                  {code === defaultLocale ? (
                    <span className="post-insights__badge post-insights__badge--neutral">Default</span>
                  ) : null}
                  {code === activeLocale ? (
                    <span className="post-insights__badge post-insights__badge--accent">Active</span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="post-insights__layout">
        <section className="post-insights__section post-insights__section--media">
          <header className="post-insights__section-header">
            <div>
              <h3>Content assets</h3>
              <p>Hero image and support material linked to the active locale draft.</p>
            </div>
          </header>

          {heroPreviewURL ? (
            <figure className="post-insights__hero-card">
              <div className="post-insights__hero-preview">
                <img alt={heroImage?.alt || 'Hero image preview'} src={heroPreviewURL} />
              </div>
              <figcaption className="post-insights__hero-caption">
                <strong>{heroImage?.alt || 'Untitled image'}</strong>
                {heroImage?.caption ? <span>{heroImage.caption}</span> : null}
                {heroImage?.credit ? <span>Credit: {heroImage.credit}</span> : null}
              </figcaption>
            </figure>
          ) : (
            <div className="post-insights__hero-placeholder">
              <strong>No hero image linked</strong>
              <span>Add a hero image in the edit flow to preview it here.</span>
            </div>
          )}

          <div className="post-insights__metric-list">
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Bibliography</span>
              <strong>{contentAssets.bibliographyLabel}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Attachments</span>
              <strong>{contentAssets.attachmentCount}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Tags</span>
              <strong>{contentAssets.tagCount}</strong>
            </div>
          </div>
        </section>

        <section className="post-insights__section">
          <header className="post-insights__section-header">
            <div>
              <h3>Owned resources</h3>
              <p>Reverse-linked resources currently assigned to this post.</p>
            </div>
          </header>

          <div className="post-insights__metric-list">
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Bibliography files</span>
              <strong>{resources.bibliographyFiles}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Media files</span>
              <strong>{resources.media}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Total owned</span>
              <strong>{totalOwnedResources}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

export default PostInsights
