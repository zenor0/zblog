import type { Media, Post } from '@/payload-types'
import type { AppLocale } from '@/lib/locales'
import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { getBibliographySource, loadBibliographyEntries } from '@/lib/bibliography'
import { defaultLocale, getLocaleLabel, normalizeLocale, supportedLocales } from '@/lib/locales'

import './post-insights.scss'

type LocaleSnapshot = Pick<
  Post,
  'content' | 'title' | 'translatedAt' | 'translatedFromLocale' | 'translationStatus'
>

type LocaleCoverage = 'complete' | 'missing' | 'partial'

type LocaleInsight = {
  code: AppLocale
  coverage: LocaleCoverage
  label: string
  snapshot: LocaleSnapshot | null
}

type RelatedSummary = Pick<Post, 'attachments' | 'heroImage'> & {
  bibliography?: {
    filename?: null | string
    source?: null | string
  } | null
}

type ResourceSummary = {
  media: number
}

type BibliographySummary = {
  entryCount: number
  filename: null | string
  parseStatus: 'empty' | 'invalid' | 'ready'
}

type HeroImageSummary = Pick<Media, 'alt' | 'caption' | 'credit' | 'previewSVGURL' | 'thumbnailURL' | 'url'>

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

function hasText(value: null | string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function getCoverage(snapshot: LocaleSnapshot | null): LocaleCoverage {
  const hasTitle = hasText(snapshot?.title)
  const hasContent = hasText(snapshot?.content)

  if (hasTitle && hasContent) {
    return 'complete'
  }

  if (hasTitle || hasContent) {
    return 'partial'
  }

  return 'missing'
}

function getCoverageLabel(coverage: LocaleCoverage): string {
  switch (coverage) {
    case 'complete':
      return 'Complete'
    case 'partial':
      return 'Partial'
    default:
      return 'Missing'
  }
}

function getPresentFieldCount(snapshot: LocaleSnapshot | null): number {
  return Number(hasText(snapshot?.title)) + Number(hasText(snapshot?.content))
}

function getCoverageTone(coverage: LocaleCoverage): string {
  switch (coverage) {
    case 'complete':
      return 'success'
    case 'partial':
      return 'warning'
    default:
      return 'danger'
  }
}

function getCoverageBadgeLabel(snapshot: LocaleSnapshot | null): string {
  const coverage = getCoverage(snapshot)
  const presentFieldCount = getPresentFieldCount(snapshot)

  return `${getCoverageLabel(coverage)} ${presentFieldCount}/2`
}

function formatStatus(value: LocaleSnapshot['translationStatus']): string {
  switch (value) {
    case 'machine':
      return 'Machine'
    case 'original':
      return 'Original'
    case 'reviewed':
      return 'Reviewed'
    default:
      return 'Not set'
  }
}

function getStatusTone(value: LocaleSnapshot['translationStatus']): string {
  switch (value) {
    case 'reviewed':
      return 'success'
    case 'machine':
      return 'warning'
    case 'original':
      return 'muted'
    default:
      return 'muted'
  }
}

function formatDate(value: null | string | undefined, activeLocale: AppLocale): string {
  if (!value) {
    return 'Not set'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(activeLocale === 'zh-Hans' ? 'zh-Hans' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function getHeroImage(value: Post['heroImage']): HeroImageSummary | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const alt = 'alt' in value && typeof value.alt === 'string' ? value.alt : ''
  const caption = 'caption' in value && typeof value.caption === 'string' ? value.caption : null
  const credit = 'credit' in value && typeof value.credit === 'string' ? value.credit : null
  const previewSVGURL =
    'previewSVGURL' in value && typeof value.previewSVGURL === 'string' ? value.previewSVGURL : null
  const thumbnailURL =
    'thumbnailURL' in value && typeof value.thumbnailURL === 'string' ? value.thumbnailURL : null
  const url = 'url' in value && typeof value.url === 'string' ? value.url : null

  return {
    alt,
    caption,
    credit,
    previewSVGURL,
    thumbnailURL,
    url,
  }
}

function getPreviewURL(heroImage: HeroImageSummary | null): null | string {
  return heroImage?.previewSVGURL ?? heroImage?.thumbnailURL ?? heroImage?.url ?? null
}

function getLocaleNote(snapshot: LocaleSnapshot | null, activeLocale: AppLocale): null | string {
  const parts: string[] = []

  if (snapshot?.translatedFromLocale) {
    parts.push(`From ${getLocaleLabel(snapshot.translatedFromLocale)}`)
  }

  if (snapshot?.translatedAt) {
    parts.push(formatDate(snapshot.translatedAt, activeLocale))
  }

  if (parts.length === 0) {
    return null
  }

  return parts.join(' · ')
}

function countByCoverage(locales: LocaleInsight[], coverage: LocaleCoverage): number {
  return locales.filter((locale) => locale.coverage === coverage).length
}

function countByStatus(
  locales: LocaleInsight[],
  status: LocaleSnapshot['translationStatus'],
): number {
  return locales.filter((locale) => locale.snapshot?.translationStatus === status).length
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
      attachments: true,
      bibliography: true,
      heroImage: true,
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

async function buildBibliographySummary(
  bibliography: RelatedSummary['bibliography'],
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
          <h3>Post insights</h3>
          <p>Save this post first to inspect locale coverage and related resources.</p>
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
          coverage: getCoverage(snapshot),
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

  const attachmentCount = Array.isArray(references?.attachments) ? references.attachments.length : 0
  const bibliography = await buildBibliographySummary(references?.bibliography)
  const heroImage = getHeroImage(references?.heroImage)
  const heroPreviewURL = getPreviewURL(heroImage)

  const completeCount = countByCoverage(locales, 'complete')
  const partialCount = countByCoverage(locales, 'partial')
  const missingCount = countByCoverage(locales, 'missing')
  const reviewedCount = countByStatus(locales, 'reviewed')

  return (
    <section className="post-insights">
      <section className="post-insights__section">
        <header className="post-insights__section-header">
          <div>
            <h3>Locale coverage</h3>
            <p>Saved draft snapshots for each locale, optimized for quick scanning.</p>
          </div>
          <div className="post-insights__summary-strip">
            <span className="post-insights__summary-pill">{completeCount} complete</span>
            <span className="post-insights__summary-pill">{partialCount} partial</span>
            <span className="post-insights__summary-pill">{missingCount} missing</span>
            <span className="post-insights__summary-pill">{reviewedCount} reviewed</span>
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
              <h3>Hero image</h3>
              <p>Preview of the image currently linked on this locale.</p>
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
              <span>Add a hero image in the sidebar to preview it here.</span>
            </div>
          )}
        </section>

        <div className="post-insights__stack-grid">
          <section className="post-insights__section">
            <header className="post-insights__section-header">
              <div>
                <h3>References</h3>
                <p>Linked assets for the active locale draft.</p>
              </div>
            </header>

            <div className="post-insights__metric-list">
              <div className="post-insights__metric">
                <span className="post-insights__metric-label">Bibliography</span>
                <strong>
                  {bibliography.parseStatus === 'empty'
                    ? 'None stored'
                    : bibliography.parseStatus === 'invalid'
                      ? 'Invalid BibTeX'
                      : `${bibliography.entryCount} entries`}
                </strong>
              </div>
              <div className="post-insights__metric">
                <span className="post-insights__metric-label">Stored filename</span>
                <strong>{bibliography.filename ?? 'Not set'}</strong>
              </div>
              <div className="post-insights__metric">
                <span className="post-insights__metric-label">Attachments</span>
                <strong>{attachmentCount}</strong>
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
        </div>
      </div>
    </section>
  )
}

export default PostInsights
