import type { Post } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'
import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { getBibliographySource, loadBibliographyEntries } from '@/features/article/model/bibliography'
import { defaultLocale, normalizeLocale, supportedLocales } from '@/shared/i18n/locales'
import {
  buildContentAssetSummary,
  buildPublishingSnapshot,
  formatDate,
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
} from '@/features/posts/admin/postOverviewSummary'
import { getPostViewMetricKey, type PostViewMetricSummary } from '@/features/post-views/server/post-views'

import './post-insights.scss'

type RelatedSummary = Pick<
  Post,
  | '_status'
  | 'attachments'
  | 'content'
  | 'excerpt'
  | 'heroImage'
  | 'seo'
  | 'slug'
  | 'tags'
  | 'title'
  | 'updatedAt'
> & {
  bibliography?: null | Post['bibliography']
}

type ResourceSummary = {
  media: number
}

type BibliographySummary = {
  entryCount: number
  filename: null | string
  parseStatus: 'empty' | 'invalid' | 'ready'
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
      bibliography: true,
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
  const media = await args.req.payload.find({
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
  })

  return {
    media: media.totalDocs,
  }
}

function normalizeReaderMetrics(value: unknown): PostViewMetricSummary {
  const metric = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    lastViewedAt: typeof metric.lastViewedAt === 'string' ? metric.lastViewedAt : null,
    rawHits: typeof metric.rawHits === 'number' && Number.isFinite(metric.rawHits) ? metric.rawHits : 0,
    uniqueVisitors:
      typeof metric.uniqueVisitors === 'number' && Number.isFinite(metric.uniqueVisitors)
        ? metric.uniqueVisitors
        : 0,
    viewCount:
      typeof metric.viewCount === 'number' && Number.isFinite(metric.viewCount) ? metric.viewCount : 0,
  }
}

async function loadReaderMetrics(args: {
  activeLocale: AppLocale
  id: number | string
  req: UIFieldServerProps['req']
}): Promise<PostViewMetricSummary> {
  const postId = typeof args.id === 'number' ? args.id : Number(args.id)

  if (!Number.isInteger(postId) || postId <= 0) {
    return normalizeReaderMetrics(null)
  }

  const metrics = await args.req.payload.find({
    collection: 'post-view-metrics',
    depth: 0,
    limit: 1,
    pagination: false,
    req: buildLocalRequest({
      req: args.req,
    }),
    user: args.req.user,
    where: {
      metricKey: {
        equals: getPostViewMetricKey({
          locale: args.activeLocale,
          postId,
        }),
      },
    },
    ...getAccessOverride(args.req.user),
  })

  return normalizeReaderMetrics(metrics.docs[0])
}

async function buildBibliographySummary(
  bibliography: null | Post['bibliography'] | undefined,
): Promise<BibliographySummary> {
  const source = getBibliographySource(bibliography ?? null)

  if (!source?.source) {
    return {
      entryCount: 0,
      filename: source?.filename ?? null,
      parseStatus: 'empty',
    }
  }

  const entries = await loadBibliographyEntries(source)

  return {
    entryCount: entries.length,
    filename: source.filename ?? null,
    parseStatus: entries.length > 0 ? 'ready' : 'invalid',
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

  const [locales, references, resources, readerMetrics] = await Promise.all([
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
    loadReaderMetrics({
      activeLocale,
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
    bibliography: references?.bibliography,
    heroImage: references?.heroImage ?? null,
    tags: references?.tags ?? null,
  })
  const bibliography = await buildBibliographySummary(references?.bibliography ?? null)

  const bibliographyStatus =
    bibliography.parseStatus === 'empty'
      ? contentAssets.bibliographyLabel
      : bibliography.parseStatus === 'invalid'
        ? 'Invalid BibTeX'
        : `${bibliography.entryCount} entries`

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
              <strong>{bibliographyStatus}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Stored filename</span>
              <strong>{bibliography.filename ?? 'Not set'}</strong>
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
              <span className="post-insights__metric-label">Media files</span>
              <strong>{resources.media}</strong>
            </div>
          </div>
        </section>

        <section className="post-insights__section">
          <header className="post-insights__section-header">
            <div>
              <h3>Reader metrics</h3>
              <p>Aggregated from public article views for the active locale.</p>
            </div>
          </header>

          <div className="post-insights__metric-list">
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Public views</span>
              <strong>{readerMetrics.viewCount}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Unique visitors</span>
              <strong>{readerMetrics.uniqueVisitors}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Raw hits</span>
              <strong>{readerMetrics.rawHits}</strong>
            </div>
            <div className="post-insights__metric">
              <span className="post-insights__metric-label">Last viewed</span>
              <strong>{formatDate(readerMetrics.lastViewedAt, activeLocale)}</strong>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

export default PostInsights
