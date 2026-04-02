# Post Admin Detail IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the Payload post detail screen so editors see one read-only `Overview` tab and one continuous `Edit` tab instead of the current five peer tabs.

**Architecture:** Keep the existing Payload edit view and solve this as a schema-and-component reorganization, not a custom admin rewrite. Extract overview summary calculations into a pure helper that `PostInsights` consumes, then reshape the post collection fields into one overview tab and one grouped edit flow built from native `collapsible` sections.

**Tech Stack:** Payload 3.79, Next.js 15, React 19, TypeScript, Vitest, Playwright

---

## Pre-Flight

- Review the approved design in `docs/superpowers/specs/2026-04-02-post-admin-detail-ia-design.md`.
- Prefer executing this plan in an isolated git worktree so the admin schema and generated files can be regenerated safely.
- Do not change the post data shape, access rules, or hook behavior while restructuring the admin UI.

## File Map

- Create: `src/components/payload/postOverviewSummary.ts`
  - Pure helper functions for locale completeness, SEO readiness, publishing snapshot cards, and content asset summaries.
- Create: `tests/int/post-overview-summary.int.spec.ts`
  - Vitest coverage for overview summary heuristics and counts.
- Create: `tests/int/post-insights.int.spec.tsx`
  - Vitest coverage for the `PostInsights` server component markup and empty state.
- Modify: `src/components/payload/PostInsights.tsx`
  - Load the extra fields needed for overview cards and render the new overview layout.
- Modify: `src/components/payload/post-insights.scss`
  - Style the new snapshot card grid and content asset summary blocks.
- Modify: `src/collections/Posts.ts`
  - Collapse the current top-level tabs into `Overview` and `Edit`, move `heroImage` into the main edit flow, and place low-frequency sections in `collapsible` groups.
- Modify: `tests/e2e/admin.e2e.spec.ts`
  - Add a Playwright regression covering the new admin tab structure and grouped edit sections.
- Regenerate as needed: `src/app/(payload)/admin/importMap.js`, `src/payload-types.ts`

## Task 1: Extract Overview Summary Helpers

**Files:**
- Create: `src/components/payload/postOverviewSummary.ts`
- Test: `tests/int/post-overview-summary.int.spec.ts`

- [ ] **Step 1: Write the failing helper test**

Create `tests/int/post-overview-summary.int.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest'

import {
  buildContentAssetSummary,
  buildPublishingSnapshot,
  getLocaleCoverage,
  summarizeLocaleCoverage,
} from '@/components/payload/postOverviewSummary'

describe('post overview summary helpers', () => {
  it('classifies locale coverage and seo readiness using frontend fallbacks', () => {
    const snapshot = buildPublishingSnapshot({
      activeLocale: 'en',
      content: '# Payload overview\n\nBody copy used for generated metadata.',
      excerpt: 'Short excerpt',
      heroImage: {
        alt: 'Hero image',
        url: '/media/hero.png',
      },
      seo: {
        metaDescription: null,
        metaImage: null,
        metaTitle: null,
        noindex: false,
      },
      slug: 'payload-overview',
      status: 'draft',
      title: 'Payload Overview',
      translationStatus: 'machine',
      updatedAt: '2026-04-02T08:30:00.000Z',
    })

    expect(snapshot.status.value).toBe('Draft')
    expect(snapshot.content.value).toBe('Complete 2/2')
    expect(snapshot.content.tone).toBe('success')
    expect(snapshot.translation.value).toBe('Machine')
    expect(snapshot.seo.value).toBe('Ready')
    expect(snapshot.seo.tone).toBe('success')
    expect(snapshot.slug.value).toBe('payload-overview')
    expect(snapshot.noindex.value).toBe('Indexable')
  })

  it('marks missing data and noindex distinctly', () => {
    const snapshot = buildPublishingSnapshot({
      activeLocale: 'en',
      content: null,
      excerpt: null,
      heroImage: null,
      seo: {
        metaDescription: null,
        metaImage: null,
        metaTitle: null,
        noindex: true,
      },
      slug: '',
      status: 'published',
      title: 'Title only',
      translationStatus: null,
      updatedAt: null,
    })

    expect(getLocaleCoverage({ title: 'Title only', content: null })).toBe('partial')
    expect(snapshot.content.value).toBe('Partial 1/2')
    expect(snapshot.content.tone).toBe('warning')
    expect(snapshot.seo.value).toBe('Incomplete')
    expect(snapshot.seo.tone).toBe('warning')
    expect(snapshot.slug.value).toBe('Missing')
    expect(snapshot.noindex.value).toBe('Noindex')
    expect(snapshot.noindex.tone).toBe('warning')
  })

  it('summarizes locale counts and content assets', () => {
    const coverage = summarizeLocaleCoverage([
      {
        code: 'zh-Hans',
        coverage: 'complete',
        label: '简体中文',
        snapshot: {
          content: '正文',
          title: '你好',
          translatedAt: null,
          translatedFromLocale: null,
          translationStatus: 'original',
        },
      },
      {
        code: 'en',
        coverage: 'partial',
        label: 'English',
        snapshot: {
          content: null,
          title: 'Hello',
          translatedAt: '2026-04-02T09:00:00.000Z',
          translatedFromLocale: 'zh-Hans',
          translationStatus: 'machine',
        },
      },
    ])

    expect(coverage).toEqual({
      completeCount: 1,
      missingCount: 0,
      partialCount: 1,
      reviewedCount: 0,
    })

    expect(
      buildContentAssetSummary({
        attachments: [{ file: 1 }, { file: 2 }],
        bibliographyFile: {
          id: 1,
          title: 'Main bibliography',
        },
        heroImage: {
          alt: 'Hero image',
          url: '/media/hero.png',
        },
        tags: [{ value: 'payload' }, { value: 'cms' }],
      }),
    ).toMatchObject({
      attachmentCount: 2,
      bibliographyLabel: 'Main bibliography',
      hasHeroImage: true,
      tagCount: 2,
    })
  })
})
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/post-overview-summary.int.spec.ts
```

Expected:

- FAIL because `@/components/payload/postOverviewSummary` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

Create `src/components/payload/postOverviewSummary.ts` with:

```ts
import type { Media, Post } from '@/payload-types'
import type { AppLocale } from '@/lib/locales'

import { getLocaleLabel } from '@/lib/locales'
import { buildSeoDescription } from '@/lib/seo'

export type LocaleSnapshot = Pick<
  Post,
  'content' | 'title' | 'translatedAt' | 'translatedFromLocale' | 'translationStatus'
>

export type LocaleCoverage = 'complete' | 'missing' | 'partial'

export type LocaleInsight = {
  code: AppLocale
  coverage: LocaleCoverage
  label: string
  snapshot: LocaleSnapshot | null
}

export type HeroImageSummary = Pick<
  Media,
  'alt' | 'caption' | 'credit' | 'previewSVGURL' | 'thumbnailURL' | 'url'
>

type SnapshotTone = 'danger' | 'muted' | 'neutral' | 'success' | 'warning'

type SnapshotItem = {
  label: string
  tone: SnapshotTone
  value: string
}

export function hasText(value: null | string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function getLocaleCoverage(snapshot: Pick<LocaleSnapshot, 'content' | 'title'> | null): LocaleCoverage {
  const hasTitle = hasText(snapshot?.title)
  const hasContent = hasText(snapshot?.content)

  if (hasTitle && hasContent) return 'complete'
  if (hasTitle || hasContent) return 'partial'
  return 'missing'
}

export function getCoverageLabel(coverage: LocaleCoverage): string {
  switch (coverage) {
    case 'complete':
      return 'Complete'
    case 'partial':
      return 'Partial'
    default:
      return 'Missing'
  }
}

export function getCoverageTone(coverage: LocaleCoverage): SnapshotTone {
  switch (coverage) {
    case 'complete':
      return 'success'
    case 'partial':
      return 'warning'
    default:
      return 'danger'
  }
}

export function getCoverageBadgeLabel(snapshot: Pick<LocaleSnapshot, 'content' | 'title'> | null): string {
  const presentFields = Number(hasText(snapshot?.title)) + Number(hasText(snapshot?.content))
  const coverage = getLocaleCoverage(snapshot)

  return `${getCoverageLabel(coverage)} ${presentFields}/2`
}

export function formatStatus(value: LocaleSnapshot['translationStatus']): string {
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

export function getStatusTone(value: LocaleSnapshot['translationStatus']): SnapshotTone {
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

export function formatDate(value: null | string | undefined, activeLocale: AppLocale): string {
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

export function getLocaleNote(snapshot: LocaleSnapshot | null, activeLocale: AppLocale): null | string {
  const parts: string[] = []

  if (snapshot?.translatedFromLocale) {
    parts.push(`From ${getLocaleLabel(snapshot.translatedFromLocale)}`)
  }

  if (snapshot?.translatedAt) {
    parts.push(formatDate(snapshot.translatedAt, activeLocale))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

export function getBibliographyTitle(value: Post['bibliographyFile']): null | string {
  if (value && typeof value === 'object' && 'title' in value && typeof value.title === 'string') {
    return value.title
  }

  return null
}

export function getHeroImage(value: unknown): HeroImageSummary | null {
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

export function getPreviewURL(heroImage: HeroImageSummary | null): null | string {
  return heroImage?.previewSVGURL ?? heroImage?.thumbnailURL ?? heroImage?.url ?? null
}

function getSeoReadiness(args: {
  content?: null | string
  excerpt?: null | string
  heroImage?: unknown
  seo?: Post['seo'] | null
  title?: null | string
}): SnapshotItem {
  const effectiveTitle = hasText(args.seo?.metaTitle) ? args.seo?.metaTitle : args.title
  const effectiveDescription = buildSeoDescription({
    content: args.content,
    fallback: args.excerpt,
    value: args.seo?.metaDescription ?? null,
  })
  const effectiveImage = getHeroImage(args.seo?.metaImage) ?? getHeroImage(args.heroImage)
  const readyFields = Number(hasText(effectiveTitle)) + Number(hasText(effectiveDescription)) + Number(Boolean(getPreviewURL(effectiveImage)))

  if (readyFields === 3) {
    return {
      label: 'SEO',
      tone: 'success',
      value: 'Ready',
    }
  }

  if (readyFields > 0) {
    return {
      label: 'SEO',
      tone: 'warning',
      value: 'Incomplete',
    }
  }

  return {
    label: 'SEO',
    tone: 'danger',
    value: 'Missing',
  }
}

export function buildPublishingSnapshot(args: {
  activeLocale: AppLocale
  content?: null | string
  excerpt?: null | string
  heroImage?: unknown
  seo?: Post['seo'] | null
  slug?: null | string
  status?: Post['_status'] | null
  title?: null | string
  translationStatus?: LocaleSnapshot['translationStatus']
  updatedAt?: null | string
}) {
  const contentSnapshot = {
    content: args.content ?? null,
    title: args.title ?? null,
  }
  const coverage = getLocaleCoverage(contentSnapshot)

  return {
    content: {
      label: 'Content',
      tone: getCoverageTone(coverage),
      value: getCoverageBadgeLabel(contentSnapshot),
    } satisfies SnapshotItem,
    noindex: {
      label: 'Indexing',
      tone: args.seo?.noindex ? 'warning' : 'muted',
      value: args.seo?.noindex ? 'Noindex' : 'Indexable',
    } satisfies SnapshotItem,
    seo: getSeoReadiness(args),
    slug: {
      label: 'Slug',
      tone: hasText(args.slug) ? 'neutral' : 'warning',
      value: hasText(args.slug) ? args.slug!.trim() : 'Missing',
    } satisfies SnapshotItem,
    status: {
      label: 'Status',
      tone: args.status === 'published' ? 'success' : 'neutral',
      value: args.status === 'published' ? 'Published' : 'Draft',
    } satisfies SnapshotItem,
    translation: {
      label: 'Translation',
      tone: getStatusTone(args.translationStatus),
      value: formatStatus(args.translationStatus),
    } satisfies SnapshotItem,
    updatedAt: {
      label: 'Updated',
      tone: 'neutral',
      value: formatDate(args.updatedAt, args.activeLocale),
    } satisfies SnapshotItem,
  }
}

export function buildContentAssetSummary(args: Pick<Post, 'attachments' | 'bibliographyFile' | 'heroImage' | 'tags'>) {
  const heroImage = getHeroImage(args.heroImage)

  return {
    attachmentCount: Array.isArray(args.attachments) ? args.attachments.length : 0,
    bibliographyLabel: getBibliographyTitle(args.bibliographyFile) ?? 'None linked',
    hasHeroImage: Boolean(getPreviewURL(heroImage)),
    heroImage,
    tagCount: Array.isArray(args.tags) ? args.tags.length : 0,
  }
}

export function summarizeLocaleCoverage(locales: LocaleInsight[]) {
  return {
    completeCount: locales.filter((locale) => locale.coverage === 'complete').length,
    missingCount: locales.filter((locale) => locale.coverage === 'missing').length,
    partialCount: locales.filter((locale) => locale.coverage === 'partial').length,
    reviewedCount: locales.filter((locale) => locale.snapshot?.translationStatus === 'reviewed').length,
  }
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/post-overview-summary.int.spec.ts
```

Expected:

- PASS for all tests in `post-overview-summary.int.spec.ts`.

- [ ] **Step 5: Commit the helper extraction**

Run:

```bash
git add tests/int/post-overview-summary.int.spec.ts src/components/payload/postOverviewSummary.ts
git commit -m "test: cover post overview summary heuristics"
```

## Task 2: Expand `PostInsights` Into the Overview Dashboard

**Files:**
- Create: `tests/int/post-insights.int.spec.tsx`
- Modify: `src/components/payload/PostInsights.tsx`
- Modify: `src/components/payload/post-insights.scss`

- [ ] **Step 1: Write the failing component integration test**

Create `tests/int/post-insights.int.spec.tsx` with:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { PostInsights } from '@/components/payload/PostInsights'

describe('PostInsights', () => {
  it('renders publishing snapshot, locale coverage, content assets, and owned resource summaries', async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({
        content: '正文',
        title: '你好',
        translatedAt: null,
        translatedFromLocale: null,
        translationStatus: 'original',
      })
      .mockResolvedValueOnce({
        content: 'Body copy',
        title: 'Hello',
        translatedAt: '2026-04-02T09:00:00.000Z',
        translatedFromLocale: 'zh-Hans',
        translationStatus: 'reviewed',
      })
      .mockResolvedValueOnce({
        _status: 'draft',
        attachments: [{ file: 1 }],
        bibliographyFile: {
          id: 1,
          title: 'Main bibliography',
        },
        content: 'Body copy',
        excerpt: 'Short excerpt',
        heroImage: {
          alt: 'Hero image',
          thumbnailURL: '/media/hero-thumb.png',
          url: '/media/hero.png',
        },
        seo: {
          metaDescription: null,
          metaImage: null,
          metaTitle: null,
          noindex: false,
        },
        slug: 'payload-overview',
        tags: [{ value: 'payload' }],
        title: 'Hello',
        updatedAt: '2026-04-02T10:00:00.000Z',
      })

    const find = vi
      .fn()
      .mockResolvedValueOnce({ totalDocs: 1 })
      .mockResolvedValueOnce({ totalDocs: 3 })

    const markup = renderToStaticMarkup(
      await PostInsights({
        id: 42,
        req: {
          locale: 'en',
          payload: {
            find,
            findByID,
          },
          user: {
            id: 7,
            roles: ['editor'],
          },
        },
      } as any),
    )

    expect(markup).toContain('Publishing snapshot')
    expect(markup).toContain('Locale coverage')
    expect(markup).toContain('Content assets')
    expect(markup).toContain('Owned resources')
    expect(markup).toContain('payload-overview')
    expect(markup).toContain('Main bibliography')
    expect(markup).toContain('SEO')
  })

  it('shows a save-first empty state for unsaved documents', async () => {
    const markup = renderToStaticMarkup(
      await PostInsights({
        id: undefined,
        req: {
          locale: 'en',
          payload: {
            find: vi.fn(),
            findByID: vi.fn(),
          },
        },
      } as any),
    )

    expect(markup).toContain('Save this post first')
    expect(markup).toContain('Post overview')
  })
})
```

- [ ] **Step 2: Run the component integration test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/post-insights.int.spec.tsx
```

Expected:

- FAIL because the current component does not render the new overview sections or empty-state title.

- [ ] **Step 3: Implement the overview dashboard UI**

Update `src/components/payload/PostInsights.tsx`:

```tsx
import type { Post } from '@/payload-types'
import type { AppLocale } from '@/lib/locales'
import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { defaultLocale, normalizeLocale, supportedLocales } from '@/lib/locales'
import {
  buildContentAssetSummary,
  buildPublishingSnapshot,
  getCoverageBadgeLabel,
  getCoverageTone,
  getHeroImage,
  getLocaleCoverage,
  getLocaleNote,
  getPreviewURL,
  getStatusTone,
  formatStatus,
  summarizeLocaleCoverage,
  type LocaleInsight,
  type LocaleSnapshot,
} from '@/components/payload/postOverviewSummary'

import './post-insights.scss'

type RelatedSummary = Pick<
  Post,
  '_status' | 'attachments' | 'bibliographyFile' | 'content' | 'excerpt' | 'heroImage' | 'seo' | 'slug' | 'tags' | 'title' | 'updatedAt'
>

function getAccessOverride(reqUser: unknown) {
  return reqUser ? ({ overrideAccess: false as const } as const) : {}
}

function buildLocalRequest(args: {
  locale?: AppLocale
  req: UIFieldServerProps['req']
}): Partial<UIFieldServerProps['req']> {
  const localReq: Partial<UIFieldServerProps['req']> = {}

  if (args.locale) localReq.locale = args.locale
  if (args.req.user) localReq.user = args.req.user

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
            <article className={`post-insights__snapshot-card post-insights__snapshot-card--${item.tone}`} key={key}>
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
                  <span className={`post-insights__badge post-insights__badge--${getCoverageTone(coverage)}`}>
                    {getCoverageBadgeLabel(snapshot)}
                  </span>
                  <span className={`post-insights__badge post-insights__badge--${getStatusTone(snapshot?.translationStatus)}`}>
                    {formatStatus(snapshot?.translationStatus)}
                  </span>
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
```

Keep the existing `loadResourceSummary` implementation unchanged below this block.

Add the new layout styles to `src/components/payload/post-insights.scss`:

```scss
.post-insights {
  .post-insights__snapshot-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .post-insights__snapshot-card {
    border: 1px solid var(--theme-elevation-150);
    border-radius: 0.75rem;
    display: grid;
    gap: 0.35rem;
    padding: 0.9rem 1rem;
    background: var(--theme-elevation-0);
  }

  .post-insights__snapshot-card strong {
    font-size: 1rem;
    line-height: 1.2;
  }

  .post-insights__snapshot-label {
    color: var(--theme-text-dim);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .post-insights__snapshot-card--success {
    border-color: color-mix(in srgb, var(--theme-success-500) 35%, var(--theme-elevation-150));
  }

  .post-insights__snapshot-card--warning {
    border-color: color-mix(in srgb, var(--theme-warning-500) 40%, var(--theme-elevation-150));
  }

  .post-insights__snapshot-card--danger {
    border-color: color-mix(in srgb, var(--theme-error-500) 40%, var(--theme-elevation-150));
  }

  .post-insights__snapshot-card--muted,
  .post-insights__snapshot-card--neutral {
    border-color: var(--theme-elevation-150);
  }
}
```

- [ ] **Step 4: Run the overview integration tests to verify they pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/post-overview-summary.int.spec.ts tests/int/post-insights.int.spec.tsx
```

Expected:

- PASS for the helper and component tests.

- [ ] **Step 5: Commit the overview dashboard implementation**

Run:

```bash
git add tests/int/post-insights.int.spec.tsx src/components/payload/PostInsights.tsx src/components/payload/post-insights.scss
git commit -m "feat: redesign post overview dashboard"
```

## Task 3: Reshape the Post Edit Schema and Cover It in Playwright

**Files:**
- Modify: `src/collections/Posts.ts`
- Modify: `tests/e2e/admin.e2e.spec.ts`

- [ ] **Step 1: Write the failing admin e2e regression**

Add to `tests/e2e/admin.e2e.spec.ts`:

```ts
async function seedAdminLayoutPost() {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'posts',
    where: {
      slug: {
        equals: 'admin-layout-demo',
      },
    },
  })

  return payload.create({
    collection: 'posts',
    data: {
      content: '# Admin layout demo\n\nBody copy for admin layout assertions.',
      excerpt: 'Post used to verify the admin information architecture.',
      slug: 'admin-layout-demo',
      title: 'Admin Layout Demo',
    },
    draft: true,
  })
}

test('post edit view groups fields into overview and edit flows', async () => {
  const post = await seedAdminLayoutPost()

  try {
    await page.goto(`http://localhost:3000/admin/collections/posts/${post.id}`)

    const tabsField = page.locator('.tabs-field').first()

    await expect(tabsField.getByRole('tab')).toHaveCount(2)
    await expect(tabsField.getByRole('tab', { name: 'Overview' })).toBeVisible()
    await expect(tabsField.getByRole('tab', { name: 'Edit' })).toBeVisible()

    await tabsField.getByRole('tab', { name: 'Edit' }).click()

    await expect(page.getByText('Core Content')).toBeVisible()
    await expect(page.getByText('Assets & References')).toBeVisible()
    await expect(page.getByText('Translation')).toBeVisible()
    await expect(page.getByText('SEO')).toBeVisible()
    await expect(page.getByText('Managed Resources')).toBeVisible()
    await expect(page.getByLabel('Slug')).toBeVisible()
  } finally {
    await cleanupPostByID(post.id)
  }
})
```

- [ ] **Step 2: Run the admin e2e regression to verify it fails**

Run:

```bash
pnpm exec playwright test --config=playwright.config.ts tests/e2e/admin.e2e.spec.ts -g "post edit view groups fields into overview and edit flows"
```

Expected:

- FAIL because the post schema still exposes the old tab layout.

- [ ] **Step 3: Reorganize `Posts.ts` into `Overview` and `Edit`**

Replace the current `tabs` definition in `src/collections/Posts.ts` with:

```ts
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'postInsights',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/payload/PostInsights#PostInsights',
                },
              },
            },
          ],
        },
        {
          label: 'Edit',
          fields: [
            {
              label: 'Core Content',
              type: 'collapsible',
              fields: [
                {
                  localized: true,
                  name: 'title',
                  required: true,
                  type: 'text',
                },
                {
                  localized: true,
                  name: 'excerpt',
                  type: 'textarea',
                },
                {
                  admin: {
                    description:
                      'Markdown is supported here, including blockquotes, fenced code, tables, GitHub-style callouts via > [!NOTE], and citations via [@citation-key].',
                    language: 'markdown',
                  },
                  localized: true,
                  name: 'content',
                  required: true,
                  type: 'code',
                },
              ],
            },
            {
              label: 'Assets & References',
              type: 'collapsible',
              fields: [
                {
                  filterOptions: sharedOrCurrentPostOwnedFilter,
                  name: 'heroImage',
                  relationTo: 'media',
                  type: 'relationship',
                },
                {
                  admin: {
                    description:
                      'Link a BibTeX source here. Citation keys used in the current locale content are validated against the stored bibliography text.',
                  },
                  filterOptions: sharedOrCurrentPostOwnedFilter,
                  name: 'bibliographyFile',
                  relationTo: 'bibliography-files',
                  type: 'relationship',
                },
                {
                  name: 'attachments',
                  type: 'array',
                  fields: [
                    {
                      filterOptions: sharedOrCurrentPostOwnedFilter,
                      name: 'file',
                      relationTo: 'media',
                      required: true,
                      type: 'relationship',
                    },
                    {
                      name: 'label',
                      type: 'text',
                    },
                    {
                      name: 'description',
                      type: 'textarea',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Translation',
              type: 'collapsible',
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  localized: true,
                  name: 'translationStatus',
                  type: 'select',
                  defaultValue: 'original',
                  options: [
                    {
                      label: 'Original',
                      value: 'original',
                    },
                    {
                      label: 'Machine translated',
                      value: 'machine',
                    },
                    {
                      label: 'Human reviewed',
                      value: 'reviewed',
                    },
                  ],
                },
                {
                  label: 'Translation metadata',
                  type: 'collapsible',
                  admin: {
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      admin: {
                        readOnly: true,
                      },
                      localized: true,
                      name: 'translatedFromLocale',
                      type: 'text',
                    },
                    {
                      admin: {
                        date: {
                          pickerAppearance: 'dayAndTime',
                        },
                        readOnly: true,
                      },
                      localized: true,
                      name: 'translatedAt',
                      type: 'date',
                    },
                    {
                      admin: {
                        readOnly: true,
                      },
                      localized: true,
                      name: 'translationProvider',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              label: 'SEO',
              type: 'collapsible',
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'seo',
                  type: 'group',
                  fields: [
                    {
                      name: 'metaTitle',
                      type: 'text',
                      admin: {
                        description:
                          'Optional SEO title override for the current locale. Leave blank to reuse the post title.',
                      },
                      localized: true,
                      maxLength: 70,
                      label: 'SEO title',
                    },
                    {
                      name: 'metaDescription',
                      type: 'textarea',
                      admin: {
                        description:
                          'Optional SEO description override for the current locale. Leave blank to reuse the excerpt or a summary derived from the post body.',
                      },
                      localized: true,
                      maxLength: 180,
                      label: 'SEO description',
                    },
                    {
                      admin: {
                        description:
                          'Optional social sharing image override. Leave blank to reuse the hero image, then the site default image.',
                      },
                      filterOptions: sharedOrCurrentPostOwnedFilter,
                      name: 'metaImage',
                      relationTo: 'media',
                      type: 'relationship',
                      label: 'Social image',
                    },
                    {
                      name: 'noindex',
                      type: 'checkbox',
                      admin: {
                        description:
                          'Prevent this locale from appearing in search results or the sitemap. Leave disabled for normal published posts.',
                      },
                      defaultValue: false,
                      localized: true,
                      label: 'No index',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Managed Resources',
              type: 'collapsible',
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'ownedBibliographyFiles',
                  type: 'join',
                  collection: 'bibliography-files',
                  on: 'ownerPost',
                  defaultLimit: 10,
                  defaultSort: '-updatedAt',
                  maxDepth: 0,
                  admin: {
                    allowCreate: false,
                    defaultColumns: ['title', 'filename', 'updatedAt'],
                  },
                  label: 'Owned bibliography files',
                },
                {
                  name: 'ownedMedia',
                  type: 'join',
                  collection: 'media',
                  on: 'ownerPost',
                  defaultLimit: 12,
                  defaultSort: '-updatedAt',
                  maxDepth: 0,
                  admin: {
                    allowCreate: false,
                    defaultColumns: ['filename', 'alt', 'updatedAt'],
                  },
                  label: 'Owned media',
                },
              ],
            },
          ],
        },
      ],
    },
```

Keep the sidebar fields as:

```ts
    {
      admin: {
        position: 'sidebar',
      },
      name: 'slug',
      index: true,
      required: true,
      type: 'text',
      unique: true,
    },
    {
      admin: {
        position: 'sidebar',
      },
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'value',
          required: true,
          type: 'text',
        },
      ],
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
      name: 'publishedAt',
      type: 'date',
    },
```

- [ ] **Step 4: Run the targeted admin regression to verify it passes**

Run:

```bash
pnpm exec playwright test --config=playwright.config.ts tests/e2e/admin.e2e.spec.ts -g "post edit view groups fields into overview and edit flows"
```

Expected:

- PASS for the new layout regression.

- [ ] **Step 5: Commit the schema reorganization**

Run:

```bash
git add src/collections/Posts.ts tests/e2e/admin.e2e.spec.ts
git commit -m "feat: simplify post admin tabs"
```

## Task 4: Regenerate Artifacts and Run Final Verification

**Files:**
- Modify as generated: `src/app/(payload)/admin/importMap.js`
- Modify as generated: `src/payload-types.ts`

- [ ] **Step 1: Regenerate the import map after touching admin components**

Run:

```bash
pnpm run generate:importmap
```

Expected:

- Exit code `0`.
- `src/app/(payload)/admin/importMap.js` is updated only if the generated hashes changed.

- [ ] **Step 2: Regenerate Payload types after the schema layout update**

Run:

```bash
pnpm run generate:types
```

Expected:

- Exit code `0`.
- `src/payload-types.ts` reflects the latest collection shape without semantic data-model changes.

- [ ] **Step 3: Run the targeted integration test suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/post-overview-summary.int.spec.ts tests/int/post-insights.int.spec.tsx
```

Expected:

- PASS for both targeted integration tests.

- [ ] **Step 4: Run the targeted admin e2e regression**

Run:

```bash
pnpm exec playwright test --config=playwright.config.ts tests/e2e/admin.e2e.spec.ts -g "post edit view groups fields into overview and edit flows"
```

Expected:

- PASS for the new Playwright regression.

- [ ] **Step 5: Run the TypeScript verification required by the repo**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected:

- Exit code `0`.
- No TypeScript errors.

- [ ] **Step 6: Commit the generated files and final verification pass**

Run:

```bash
git add "src/app/(payload)/admin/importMap.js" src/payload-types.ts
git commit -m "chore: regenerate admin artifacts for post IA update"
```

## Self-Review Checklist

- Spec coverage:
  - `Overview / Edit` split is covered in Task 3.
  - Overview snapshot, locale coverage, content assets, and owned-resource summary are covered in Tasks 1 and 2.
  - Sidebar reduction and `heroImage` relocation are covered in Task 3.
  - Type generation, import map generation, and verification are covered in Task 4.
- Placeholder scan:
  - No `TODO`, `TBD`, or "similar to above" shortcuts remain.
- Type consistency:
  - Helper exports referenced in Task 2 are defined in Task 1.
  - The Playwright assertion labels match the section labels introduced in Task 3.
