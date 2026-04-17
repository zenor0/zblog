# Post Admin IA and Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Payload post edit experience so `Overview` is the default first tab, the old overloaded `Edit` flow is split into top-level tabs, translation management becomes locale-agnostic, and bibliography editing starts collapsed with Payload-native admin styling.

**Architecture:** Keep the post collection on a single Payload `tabs` field, but replace the old `Edit` tab with separate top-level tabs for content, assets, translation management, and SEO. Implement translation management as a dedicated admin UI field backed by a pure locale-summary helper and a focused client action component that calls the existing `autoTranslatePostEndpoint` with explicit source and target locales. Keep the bibliography schema intact, but change the custom group field to default every structured entry to collapsed and swap its custom rounded chrome for lighter Payload-style controls.

**Tech Stack:** Payload CMS 3, Next.js 15, React 19, TypeScript, Payload admin custom components, Vitest, Playwright, Testing Library

---

## File Map

- Modify: `src/collections/Posts.ts`
  - Promote the current `Edit` sections into top-level tabs.
  - Move `Overview` to the first tab.
  - Remove the locale-bound header translate control from `beforeDocumentControls`.
  - Keep translation schema fields in the collection, but hide them from direct editing.
- Create: `src/components/payload/postTranslationSummary.ts`
  - Pure helper for per-locale completion counts and row summaries.
- Create: `src/components/payload/PostTranslationManager.tsx`
  - Server admin UI field component that loads all locale snapshots for the current post.
- Create: `src/components/payload/TranslatePostLocaleAction.tsx`
  - Client component for choosing a source locale and posting to `/:id/auto-translate`.
- Create: `src/components/payload/post-translation-manager.scss`
  - Minimal admin styling for the translation panel.
- Modify: `src/components/payload/BibliographyField.tsx`
  - Default structured entries to collapsed.
  - Use Payload `Button` for actions.
  - Preserve raw-mode fallback.
- Modify: `src/components/payload/bibliography-field.scss`
  - Remove heavy rounded card/button styling.
  - Keep layout-only styles.
- Modify: `vitest.setup.ts`
  - Add Testing Library cleanup for the new client-component tests.
- Modify: `src/app/(payload)/admin/importMap.js`
  - Regenerated after wiring the new Payload admin components.
- Modify: `src/payload-types.ts`
  - Regenerated after collection admin config changes.
- Create: `tests/int/post-translation-summary.int.spec.ts`
  - Pure helper tests for completion counts and row metadata.
- Create: `tests/int/post-translation-manager.int.spec.ts`
  - Server render tests for the translation management panel.
- Create: `tests/int/translate-post-locale-action.int.spec.tsx`
  - Client interaction tests for source-locale selection and endpoint payloads.
- Create: `tests/int/posts-admin-config.int.spec.ts`
  - Collection config test for new top-level tab structure.
- Create: `tests/int/post-auto-translate-endpoint.int.spec.ts`
  - Unit tests for endpoint validation regression coverage.
- Create: `tests/int/bibliography-field.int.spec.tsx`
  - Client behavior tests for collapsed structured entries and raw fallback.
- Modify: `tests/e2e/admin.e2e.spec.ts`
  - Update admin expectations to the new tab layout and translation workflow.

## Task 1: Add Translation Summary Helpers

**Files:**
- Create: `src/components/payload/postTranslationSummary.ts`
- Test: `tests/int/post-translation-summary.int.spec.ts`

- [ ] **Step 1: Write the failing helper test**

```ts
import { describe, expect, it } from 'vitest'

import {
  buildTranslationLocaleRow,
  countTranslatedFields,
} from '@/components/payload/postTranslationSummary'

describe('postTranslationSummary', () => {
  it('counts translated title, excerpt, and content fields', () => {
    expect(
      countTranslatedFields({
        content: 'Body copy',
        excerpt: '',
        title: 'Hello',
      }),
    ).toBe(2)
  })

  it('builds locale row metadata for badges and completion text', () => {
    const row = buildTranslationLocaleRow({
      activeLocale: 'zh-Hans',
      locale: 'en',
      snapshot: {
        content: 'Body copy',
        excerpt: null,
        title: 'Hello',
        translatedAt: '2026-04-03T08:00:00.000Z',
        translatedFromLocale: 'zh-Hans',
        translationStatus: 'machine',
      },
    })

    expect(row.code).toBe('en')
    expect(row.label).toBe('English')
    expect(row.completedFields).toBe(2)
    expect(row.completionLabel).toBe('2/3')
    expect(row.isActive).toBe(false)
    expect(row.isDefault).toBe(false)
    expect(row.translationStatusLabel).toBe('Machine')
    expect(row.translationNote).toContain('From 简体中文')
  })
})
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts tests/int/post-translation-summary.int.spec.ts
```

Expected: FAIL with module resolution errors for `@/components/payload/postTranslationSummary` or missing exported functions.

- [ ] **Step 3: Write the minimal helper implementation**

```ts
import type { AppLocale } from '@/lib/locales'
import type { Post } from '@/payload-types'

import { defaultLocale, getLocaleLabel } from '@/lib/locales'
import { formatDate, formatStatus, getLocaleNote, hasText } from '@/components/payload/postOverviewSummary'

export type TranslationLocaleSnapshot = {
  content?: null | string
  excerpt?: null | string
  title?: null | string
  translatedAt?: null | string
  translatedFromLocale?: null | string
  translationStatus?: Post['translationStatus']
}

export type TranslationLocaleRow = {
  code: AppLocale
  completedFields: number
  completionLabel: string
  isActive: boolean
  isDefault: boolean
  label: string
  snapshot: TranslationLocaleSnapshot | null
  translationNote: null | string
  translationStatusLabel: string
}

export function countTranslatedFields(snapshot: TranslationLocaleSnapshot | null): number {
  return Number(hasText(snapshot?.title)) + Number(hasText(snapshot?.excerpt)) + Number(hasText(snapshot?.content))
}

export function buildTranslationLocaleRow(args: {
  activeLocale: AppLocale
  locale: AppLocale
  snapshot: TranslationLocaleSnapshot | null
}): TranslationLocaleRow {
  const completedFields = countTranslatedFields(args.snapshot)

  return {
    code: args.locale,
    completedFields,
    completionLabel: `${completedFields}/3`,
    isActive: args.locale === args.activeLocale,
    isDefault: args.locale === defaultLocale,
    label: getLocaleLabel(args.locale),
    snapshot: args.snapshot,
    translationNote: getLocaleNote(args.snapshot, args.activeLocale),
    translationStatusLabel: formatStatus(args.snapshot?.translationStatus),
  }
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts tests/int/post-translation-summary.int.spec.ts
```

Expected: PASS with 2 passing tests in `post-translation-summary.int.spec.ts`.

- [ ] **Step 5: Commit**

```bash
git add tests/int/post-translation-summary.int.spec.ts src/components/payload/postTranslationSummary.ts
git commit -m "test: add post translation summary helpers"
```

## Task 2: Build the Translation Management Components

**Files:**
- Modify: `vitest.setup.ts`
- Create: `src/components/payload/PostTranslationManager.tsx`
- Create: `src/components/payload/TranslatePostLocaleAction.tsx`
- Create: `src/components/payload/post-translation-manager.scss`
- Create: `tests/int/post-translation-manager.int.spec.ts`
- Create: `tests/int/translate-post-locale-action.int.spec.tsx`
- Create: `tests/int/post-auto-translate-endpoint.int.spec.ts`

- [ ] **Step 1: Write the failing server-component and client-action tests**

```ts
// tests/int/post-translation-manager.int.spec.ts
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { PostTranslationManager } from '@/components/payload/PostTranslationManager'

describe('PostTranslationManager', () => {
  it('shows a save-first state for unsaved posts', async () => {
    const markup = renderToStaticMarkup(
      await (PostTranslationManager as any)({
        id: undefined,
        req: {
          locale: 'zh-Hans',
          payload: {
            findByID: vi.fn(),
          },
        },
      } as any),
    )

    expect(markup).toContain('Save this post first')
    expect(markup).toContain('Translation management')
  })

  it('renders every locale with completion and edit links', async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({
        content: '正文',
        excerpt: '摘要',
        title: '你好',
        translatedAt: null,
        translatedFromLocale: null,
        translationStatus: 'original',
      })
      .mockResolvedValueOnce({
        content: 'Body copy',
        excerpt: '',
        title: 'Hello',
        translatedAt: '2026-04-03T08:00:00.000Z',
        translatedFromLocale: 'zh-Hans',
        translationStatus: 'machine',
      })

    const markup = renderToStaticMarkup(
      await (PostTranslationManager as any)({
        id: 42,
        req: {
          locale: 'zh-Hans',
          payload: {
            config: {
              routes: {
                admin: '/admin',
              },
            },
            findByID,
          },
          user: {
            id: 7,
            roles: ['editor'],
          },
        },
      } as any),
    )

    expect(markup).toContain('Translation management')
    expect(markup).toContain('English')
    expect(markup).toContain('2/3')
    expect(markup).toContain('/admin/collections/posts/42?locale=en')
  })
})
```

```tsx
// tests/int/translate-post-locale-action.int.spec.tsx
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
const success = vi.fn()
const error = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh,
  }),
}))

vi.mock('@payloadcms/ui', async () => {
  const actual = await vi.importActual<any>('@payloadcms/ui')

  return {
    ...actual,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    toast: {
      error,
      success,
    },
    useConfig: () => ({
      config: {
        routes: {
          api: '/api',
        },
      },
    }),
  }
})

import { TranslatePostLocaleAction } from '@/components/payload/TranslatePostLocaleAction'

describe('TranslatePostLocaleAction', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
        ok: true,
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('posts explicit source and target locales', async () => {
    render(
      <TranslatePostLocaleAction
        collectionSlug="posts"
        id={42}
        sourceOptions={[
          { code: 'zh-Hans', label: '简体中文' },
          { code: 'en', label: 'English' },
        ]}
        targetLocale="en"
        targetLabel="English"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Translate from...' }))
    fireEvent.change(screen.getByLabelText('Source locale'), {
      target: {
        value: 'zh-Hans',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Run translation' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/posts/42/auto-translate',
        expect.objectContaining({
          body: JSON.stringify({
            sourceLocale: 'zh-Hans',
            targetLocale: 'en',
          }),
          method: 'POST',
        }),
      )
    })

    expect(refresh).toHaveBeenCalled()
    expect(success).toHaveBeenCalled()
  })
})
```

```ts
// tests/int/post-auto-translate-endpoint.int.spec.ts
import { describe, expect, it, vi } from 'vitest'

import { autoTranslatePostEndpoint } from '@/endpoints/posts/autoTranslatePost'

describe('autoTranslatePostEndpoint', () => {
  it('rejects matching source and target locales', async () => {
    await expect(
      autoTranslatePostEndpoint.handler({
        json: async () => ({
          sourceLocale: 'en',
          targetLocale: 'en',
        }),
        routeParams: {
          id: 42,
        },
        user: {
          roles: ['editor'],
        },
      } as any),
    ).rejects.toThrow('Source locale and target locale must be different.')
  })

  it('rejects source locales that are missing title or content', async () => {
    await expect(
      autoTranslatePostEndpoint.handler({
        json: async () => ({
          sourceLocale: 'zh-Hans',
          targetLocale: 'en',
        }),
        payload: {
          findByID: vi.fn().mockResolvedValue({
            content: '',
            title: '',
          }),
        },
        routeParams: {
          id: 42,
        },
        user: {
          roles: ['editor'],
        },
      } as any),
    ).rejects.toThrow('is missing title or content')
  })
})
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts \
  tests/int/post-translation-manager.int.spec.ts \
  tests/int/translate-post-locale-action.int.spec.tsx \
  tests/int/post-auto-translate-endpoint.int.spec.ts
```

Expected: FAIL because the translation manager components do not exist yet.

- [ ] **Step 3: Add minimal Testing Library cleanup and implement the new translation UI**

```ts
// vitest.setup.ts
import 'dotenv/config'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

```tsx
// src/components/payload/TranslatePostLocaleAction.tsx
'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type SourceOption = {
  code: string
  label: string
}

type TranslatePostLocaleActionProps = {
  collectionSlug: string
  id: number | string
  sourceOptions: SourceOption[]
  targetLabel: string
  targetLocale: string
}

export function TranslatePostLocaleAction(props: TranslatePostLocaleActionProps) {
  const router = useRouter()
  const { config } = useConfig()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [sourceLocale, setSourceLocale] = useState('')

  const availableSources = useMemo(
    () => props.sourceOptions.filter((option) => option.code !== props.targetLocale),
    [props.sourceOptions, props.targetLocale],
  )

  async function handleTranslate() {
    if (!sourceLocale) {
      toast.error('Choose a source locale first.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${config.routes.api}/${props.collectionSlug}/${props.id}/auto-translate`, {
        body: JSON.stringify({
          sourceLocale,
          targetLocale: props.targetLocale,
        }),
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { message?: string } | null

      if (!response.ok) {
        throw new Error(payload?.message || `Translation failed with status ${response.status}.`)
      }

      toast.success(`Updated ${props.targetLabel} from ${sourceLocale}.`)
      setIsOpen(false)
      setSourceLocale('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Translation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="post-translation-manager__action">
      <Button buttonStyle="secondary" onClick={() => setIsOpen((value) => !value)} size="small">
        Translate from...
      </Button>

      {isOpen ? (
        <div className="post-translation-manager__action-panel">
          <label>
            <span>Source locale</span>
            <select onChange={(event) => setSourceLocale(event.target.value)} value={sourceLocale}>
              <option value="">Select a locale</option>
              {availableSources.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="post-translation-manager__action-buttons">
            <Button buttonStyle="primary" disabled={!sourceLocale || isLoading} onClick={handleTranslate} size="small">
              {isLoading ? 'Translating…' : 'Run translation'}
            </Button>
            <Button buttonStyle="secondary" onClick={() => setIsOpen(false)} size="small">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
```

```tsx
// src/components/payload/PostTranslationManager.tsx
import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { defaultLocale, normalizeLocale, supportedLocales } from '@/lib/locales'
import { TranslatePostLocaleAction } from '@/components/payload/TranslatePostLocaleAction'
import { buildTranslationLocaleRow } from '@/components/payload/postTranslationSummary'

import './post-translation-manager.scss'

function getAccessOverride(reqUser: unknown) {
  return reqUser ? ({ overrideAccess: false as const } as const) : {}
}

function buildLocalRequest(args: {
  locale?: string
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

export const PostTranslationManager: UIFieldServerComponent = async ({ id, req }) => {
  if (typeof id !== 'number' && typeof id !== 'string') {
    return (
      <section className="post-translation-manager">
        <div className="post-translation-manager__empty">
          <h3>Translation management</h3>
          <p>Save this post first to manage locale versions and translation actions.</p>
        </div>
      </section>
    )
  }

  const activeLocale =
    normalizeLocale(typeof req.locale === 'string' ? req.locale : undefined) ?? defaultLocale
  const adminRoute = req.payload.config.routes.admin

  const rows = await Promise.all(
    supportedLocales.map(async (locale) => {
      const snapshot = await req.payload.findByID({
        collection: 'posts',
        depth: 0,
        draft: true,
        fallbackLocale: false,
        id,
        locale: locale.code,
        req: buildLocalRequest({
          locale: locale.code,
          req,
        }),
        select: {
          content: true,
          excerpt: true,
          title: true,
          translatedAt: true,
          translatedFromLocale: true,
          translationStatus: true,
        },
        user: req.user,
        ...getAccessOverride(req.user),
      })

      return buildTranslationLocaleRow({
        activeLocale,
        locale: locale.code,
        snapshot,
      })
    }),
  )

  return (
    <section className="post-translation-manager">
      <header className="post-translation-manager__header">
        <div>
          <h3>Translation management</h3>
          <p>Review every locale version and trigger translations without switching the admin locale.</p>
        </div>
      </header>

      <ul className="post-translation-manager__rows">
        {rows.map((row) => (
          <li className="post-translation-manager__row" key={row.code}>
            <div className="post-translation-manager__copy">
              <strong>{row.label}</strong>
              <span>{row.completionLabel}</span>
              <span>{row.translationStatusLabel}</span>
              {row.translationNote ? <span>{row.translationNote}</span> : null}
            </div>

            <div className="post-translation-manager__actions">
              {row.isDefault ? <span className="post-translation-manager__badge">Default</span> : null}
              {row.isActive ? <span className="post-translation-manager__badge">Active</span> : null}
              <a href={`${adminRoute}/collections/posts/${id}?locale=${row.code}`}>Edit locale</a>
              <TranslatePostLocaleAction
                collectionSlug="posts"
                id={id}
                sourceOptions={rows.map((item) => ({
                  code: item.code,
                  label: item.label,
                }))}
                targetLabel={row.label}
                targetLocale={row.code}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

```scss
/* src/components/payload/post-translation-manager.scss */
.post-translation-manager {
  display: grid;
  gap: 1rem;
}

.post-translation-manager__rows {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.post-translation-manager__row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 1rem;
  border: 1px solid var(--theme-elevation-150);
}

.post-translation-manager__copy,
.post-translation-manager__actions,
.post-translation-manager__action-panel,
.post-translation-manager__action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.post-translation-manager__copy {
  flex-direction: column;
  align-items: flex-start;
}

.post-translation-manager__action-panel {
  display: grid;
  gap: 0.75rem;
}

.post-translation-manager__action-panel label {
  display: grid;
  gap: 0.35rem;
}

@media (max-width: 900px) {
  .post-translation-manager__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- [ ] **Step 4: Run the translation tests to verify they pass**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts \
  tests/int/post-translation-summary.int.spec.ts \
  tests/int/post-translation-manager.int.spec.ts \
  tests/int/translate-post-locale-action.int.spec.tsx \
  tests/int/post-auto-translate-endpoint.int.spec.ts
```

Expected: PASS with all new translation-related integration tests green.

- [ ] **Step 5: Commit**

```bash
git add \
  vitest.setup.ts \
  src/components/payload/postTranslationSummary.ts \
  src/components/payload/PostTranslationManager.tsx \
  src/components/payload/TranslatePostLocaleAction.tsx \
  src/components/payload/post-translation-manager.scss \
  tests/int/post-translation-manager.int.spec.ts \
  tests/int/translate-post-locale-action.int.spec.tsx \
  tests/int/post-auto-translate-endpoint.int.spec.ts
git commit -m "feat: add locale-agnostic post translation manager"
```

## Task 3: Promote Post Sections to Top-Level Tabs

**Files:**
- Modify: `src/collections/Posts.ts`
- Create: `tests/int/posts-admin-config.int.spec.ts`
- Modify: `tests/e2e/admin.e2e.spec.ts`

- [ ] **Step 1: Write the failing collection-config and admin e2e tests**

```ts
// tests/int/posts-admin-config.int.spec.ts
import { describe, expect, it } from 'vitest'

import { Posts } from '@/collections/Posts'

describe('Posts collection admin tabs', () => {
  it('promotes edit sections to top-level tabs with overview first', () => {
    const tabsField = Posts.fields.find((field: any) => field.type === 'tabs') as any

    expect(tabsField.tabs.map((tab: any) => tab.label)).toEqual([
      'Overview',
      'Core Content',
      'Assets & References',
      'Translation',
      'SEO',
    ])

    expect(Posts.admin?.components?.edit?.beforeDocumentControls).toEqual([
      '/components/payload/PostPackageImportAction#PostPackageImportAction',
    ])

    expect(
      tabsField.tabs[1].fields.some((field: any) => field.name === 'ownedMedia'),
    ).toBe(true)

    expect(
      tabsField.tabs[3].fields.some((field: any) => field.name === 'postTranslations'),
    ).toBe(true)
  })
})
```

```ts
// tests/e2e/admin.e2e.spec.ts
test('can open the posts collection and create view with overview first', async () => {
  await page.goto('http://localhost:3000/admin/collections/posts')
  await expect(page).toHaveURL(/http:\/\/localhost:3000\/admin\/collections\/posts(\?depth=1&limit=10)?$/)

  await page.goto('http://localhost:3000/admin/collections/posts/create')
  await expect(page.getByText('Save this post first')).toBeVisible()
  await expect(page.getByTestId('post-import-trigger')).toBeVisible()

  await page.getByRole('button', { name: 'Core Content' }).click()
  await expect(page.locator('input[name=\"title\"]')).toBeVisible()
  await expect(page.locator('input[name=\"slug\"]')).toBeVisible()
})

test('post edit view uses overview-first top-level workflow tabs', async () => {
  const post = await seedAdminLayoutPost()

  try {
    await page.goto(`http://localhost:3000/admin/collections/posts/${post.id}`)

    const documentPane = page.locator('main')
    const overviewTab = documentPane.getByRole('button', { name: 'Overview' })
    const coreTab = documentPane.getByRole('button', { name: 'Core Content' })
    const assetsTab = documentPane.getByRole('button', { name: 'Assets & References' })
    const translationTab = documentPane.getByRole('button', { name: 'Translation' })
    const seoTab = documentPane.getByRole('button', { name: 'SEO' })

    await expect(overviewTab).toBeVisible()
    await expect(coreTab).toBeVisible()
    await expect(assetsTab).toBeVisible()
    await expect(translationTab).toBeVisible()
    await expect(seoTab).toBeVisible()

    await expect(page.getByText('Publishing snapshot')).toBeVisible()

    await coreTab.click()
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()
    await expect(page.getByText('Owned media')).toBeVisible()

    await translationTab.click()
    await expect(page.getByText('Translation management')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Translate from...' }).first()).toBeVisible()
  } finally {
    await cleanupPostByID(post.id)
  }
})
```

- [ ] **Step 2: Run the collection-config and targeted admin e2e tests to verify they fail**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts tests/int/posts-admin-config.int.spec.ts
pnpm playwright test --config playwright.config.ts tests/e2e/admin.e2e.spec.ts --grep "create view with overview first|overview-first top-level workflow tabs"
```

Expected:
- Vitest FAIL because `Posts.ts` still exposes `Edit` and `Overview`.
- Playwright FAIL because the create view still opens on direct content fields and the post edit screen still uses the old tab layout.

- [ ] **Step 3: Update the collection config to the new IA and wire the translation manager**

```ts
// src/collections/Posts.ts (tabs section only)
fields: [
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
        label: 'Core Content',
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
      {
        label: 'Assets & References',
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
                'Store one BibTeX source directly on this post. Structured editing is available for safe, common entries.',
              components: {
                Field: '/components/payload/BibliographyField#BibliographyField',
              },
            },
            name: 'bibliography',
            type: 'group',
            fields: [
              {
                admin: {
                  description: 'Optional original filename for the BibTeX source stored on this post.',
                },
                name: 'filename',
                type: 'text',
              },
              {
                admin: {
                  description:
                    'Paste BibTeX source here. Citation keys used in the current locale content are validated against this text.',
                  language: 'plaintext',
                },
                name: 'source',
                type: 'code',
              },
            ],
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
        fields: [
          {
            name: 'postTranslations',
            type: 'ui',
            admin: {
              components: {
                Field: '/components/payload/PostTranslationManager#PostTranslationManager',
              },
            },
          },
          {
            localized: true,
            name: 'translationStatus',
            type: 'select',
            defaultValue: 'original',
            admin: {
              hidden: true,
            },
            options: [
              { label: 'Original', value: 'original' },
              { label: 'Machine translated', value: 'machine' },
              { label: 'Human reviewed', value: 'reviewed' },
            ],
          },
          {
            admin: {
              hidden: true,
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
              hidden: true,
              readOnly: true,
            },
            localized: true,
            name: 'translatedAt',
            type: 'date',
          },
          {
            admin: {
              hidden: true,
              readOnly: true,
            },
            localized: true,
            name: 'translationProvider',
            type: 'text',
          },
        ],
      },
      {
        label: 'SEO',
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
    ],
  },
]
```

After this `tabs` field, keep the current sidebar fields in the same order:
- `slug`
- `tags`
- `publishedAt`

```ts
// src/collections/Posts.ts (admin.components.edit only)
admin: {
  components: {
    edit: {
      beforeDocumentControls: [
        '/components/payload/PostPackageImportAction#PostPackageImportAction',
      ],
    },
    views: {
      edit: {
        livePreview: {
          Component: '/components/payload/PostLivePreviewView#PostLivePreviewView',
        },
      },
    },
  },
}
```

Keep the rest of the current `admin` config blocks directly below this snippet:
- `defaultColumns`
- `group`
- `livePreview`
- `preview`
- `useAsTitle`

- [ ] **Step 4: Run the collection-config and targeted e2e tests to verify they pass**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts tests/int/posts-admin-config.int.spec.ts
pnpm playwright test --config playwright.config.ts tests/e2e/admin.e2e.spec.ts --grep "create view with overview first|overview-first top-level workflow tabs"
```

Expected:
- Vitest PASS for the new tab layout.
- Playwright PASS for the updated admin IA smoke test.

- [ ] **Step 5: Commit**

```bash
git add src/collections/Posts.ts tests/int/posts-admin-config.int.spec.ts tests/e2e/admin.e2e.spec.ts
git commit -m "feat: promote post admin sections to top-level tabs"
```

## Task 4: Collapse Structured Bibliography Entries and Revert to Payload-Native Styling

**Files:**
- Modify: `src/components/payload/BibliographyField.tsx`
- Modify: `src/components/payload/bibliography-field.scss`
- Create: `tests/int/bibliography-field.int.spec.tsx`

- [ ] **Step 1: Write the failing bibliography field test**

```tsx
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const setSourceValue = vi.fn()
const setFilenameValue = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  useField: ({ path }: { path: string }) => {
    if (path === 'bibliography.source') {
      return {
        setValue: setSourceValue,
        value:
          '@article{doe2025,\\n  title = {Composable Publishing Workflows},\\n  author = {Doe, Jane},\\n  year = {2025}\\n}',
      }
    }

    return {
      setValue: setFilenameValue,
      value: 'references.bib',
    }
  },
}))

import { BibliographyField } from '@/components/payload/BibliographyField'

describe('BibliographyField', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders structured entries collapsed by default and expands on demand', async () => {
    render(<BibliographyField path="bibliography" />)

    expect(screen.getByRole('button', { name: /doe2025/i })).toBeTruthy()
    expect(screen.queryByLabelText('Citation key')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /doe2025/i }))

    expect(await screen.findByLabelText('Citation key')).toBeTruthy()
    expect(screen.getByLabelText('Title')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the bibliography test to verify it fails**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts tests/int/bibliography-field.int.spec.tsx
```

Expected: FAIL because the structured editor currently renders expanded inputs immediately.

- [ ] **Step 3: Implement collapsed entry state and lighten the styling**

```tsx
// src/components/payload/BibliographyField.tsx (key excerpts)
'use client'

import type { GroupFieldClientComponent } from 'payload'
import type { BibliographyName, EditableBibliographyEntry } from '@/lib/bibliography'

import { Button, useField } from '@payloadcms/ui'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'

import {
  parseEditableBibliography,
  serializeEditableBibliography,
} from '@/lib/bibliography'

import './bibliography-field.scss'

function getEntryStateKey(entry: EditableBibliographyEntry, entryIndex: number): string {
  return `${entry.citationKey || `entry-${entryIndex + 1}`}-${entryIndex}`
}

export const BibliographyField: GroupFieldClientComponent = ({ path }) => {
  const sourcePath = `${path}.source`
  const filenamePath = `${path}.filename`
  const sourceField = useField<string>({ path: sourcePath })
  const filenameField = useField<string>({ path: filenamePath })
  const [mode, setMode] = useState<'raw' | 'structured'>('structured')
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})
  const deferredSource = useDeferredValue(typeof sourceField.value === 'string' ? sourceField.value : '')
  const parsed = useMemo(() => parseEditableBibliography(deferredSource), [deferredSource])
  const [entries, setEntries] = useState<EditableBibliographyEntry[]>(parsed.entries.map(cloneEntry))

  useEffect(() => {
    setEntries(parsed.entries.map(cloneEntry))
    setExpandedEntries((current) => {
      const next: Record<string, boolean> = {}

      parsed.entries.forEach((entry, entryIndex) => {
        const key = getEntryStateKey(entry, entryIndex)

        if (current[key]) {
          next[key] = true
        }
      })

      return next
    })
  }, [parsed.entries])

  function toggleEntry(entry: EditableBibliographyEntry, entryIndex: number) {
    const key = getEntryStateKey(entry, entryIndex)
    setExpandedEntries((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  function addEntry() {
    const nextEntry = createEmptyEntry(entries.length)
    const nextKey = getEntryStateKey(nextEntry, entries.length)

    setExpandedEntries((current) => ({
      ...current,
      [nextKey]: true,
    }))
    commitEntries([...entries, nextEntry])
  }

  return (
    <section className="bibliography-field field-type">
      <header className="bibliography-field__header">
        <div>
          <p className="bibliography-field__eyebrow">Bibliography</p>
          <h3>Post-owned BibTeX source</h3>
          <p>
            This bibliography belongs only to the current post. Structured editing is available for
            safe, common entries. Raw BibTeX is always available as the fallback.
          </p>
        </div>

        <div className="bibliography-field__mode-switch" role="tablist" aria-label="Bibliography mode">
          <Button buttonStyle={mode === 'structured' ? 'primary' : 'secondary'} onClick={() => setMode('structured')} size="small">
            Structured
          </Button>
          <Button buttonStyle={mode === 'raw' ? 'primary' : 'secondary'} onClick={() => setMode('raw')} size="small">
            Raw BibTeX
          </Button>
        </div>
      </header>

      {!parsed.isFullyEditable && deferredSource.trim() ? (
        <div className="bibliography-field__warning">
          <strong>Structured editing disabled for this source.</strong>
          <ul>
            {parsed.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="bibliography-field__meta">
        <label className="bibliography-field__meta-field">
          <span>Original filename</span>
          <input
            onChange={(event) => filenameField.setValue(event.target.value)}
            placeholder="Optional .bib filename"
            type="text"
            value={typeof filenameField.value === 'string' ? filenameField.value : ''}
          />
        </label>

        <input
          accept=".bib,text/x-bibtex,text/plain"
          hidden
          onChange={(event) => void handleFileImport(event.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />

        <button className="bibliography-field__upload" onClick={() => fileInputRef.current?.click()} type="button">
          Upload .bib
        </button>
      </div>

      {mode === 'raw' ? (
        <label className="bibliography-field__raw">
          <span>Raw BibTeX source</span>
          <textarea
            onChange={(event) => sourceField.setValue(event.target.value)}
            placeholder="@article{citation-key,...}"
            rows={18}
            value={typeof sourceField.value === 'string' ? sourceField.value : ''}
          />
        </label>
      ) : (
        <div className="bibliography-field__entries">
          {entries.length === 0 ? (
            <div className="bibliography-field__empty">
              <strong>No bibliography entries yet.</strong>
              <span>Add an entry or switch to raw mode to paste an existing BibTeX file.</span>
            </div>
          ) : null}

          {entries.map((entry, entryIndex) => {
            const entryKey = getEntryStateKey(entry, entryIndex)
            const isExpanded = expandedEntries[entryKey] === true

            return (
              <article className="bibliography-field__entry" key={entryKey}>
                <header className="bibliography-field__entry-header">
                  <button
                    className="bibliography-field__entry-toggle"
                    onClick={() => toggleEntry(entry, entryIndex)}
                    type="button"
                  >
                    <strong>{entry.citationKey || `Entry ${entryIndex + 1}`}</strong>
                    <span>{entry.entryType}</span>
                    {entry.title ? <span>{entry.title}</span> : null}
                  </button>

                  <Button buttonStyle="secondary" onClick={() => removeEntry(entryIndex)} size="small">
                    Remove entry
                  </Button>
                </header>

                {isExpanded ? (
                  <div className="bibliography-field__entry-body">
                    <div className="bibliography-field__grid">
                      <label>
                        <span>Citation key</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'citationKey', event.target.value)}
                          type="text"
                          value={entry.citationKey}
                        />
                      </label>

                      <label>
                        <span>Entry type</span>
                        <select
                          onChange={(event) => updateEntry(entryIndex, 'entryType', event.target.value)}
                          value={entry.entryType}
                        >
                          {entryTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>Title</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'title', event.target.value)}
                          type="text"
                          value={entry.title}
                        />
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>Subtitle</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'subtitle', event.target.value)}
                          type="text"
                          value={entry.subtitle}
                        />
                      </label>

                      <label>
                        <span>Date</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'date', event.target.value)}
                          type="text"
                          value={entry.date}
                        />
                      </label>

                      <label>
                        <span>Accessed</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'accessed', event.target.value)}
                          type="text"
                          value={entry.accessed}
                        />
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>Journal</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'journalTitle', event.target.value)}
                          type="text"
                          value={entry.journalTitle}
                        />
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>Book title</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'bookTitle', event.target.value)}
                          type="text"
                          value={entry.bookTitle}
                        />
                      </label>

                      <label>
                        <span>Publisher</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'publisher', event.target.value)}
                          type="text"
                          value={entry.publisher}
                        />
                      </label>

                      <label>
                        <span>Institution</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'institution', event.target.value)}
                          type="text"
                          value={entry.institution}
                        />
                      </label>

                      <label>
                        <span>Volume</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'volume', event.target.value)}
                          type="text"
                          value={entry.volume}
                        />
                      </label>

                      <label>
                        <span>Number</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'number', event.target.value)}
                          type="text"
                          value={entry.number}
                        />
                      </label>

                      <label>
                        <span>Pages</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'pages', event.target.value)}
                          type="text"
                          value={entry.pages}
                        />
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>DOI</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'doi', event.target.value)}
                          type="text"
                          value={entry.doi}
                        />
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>URL</span>
                        <input
                          onChange={(event) => updateEntry(entryIndex, 'url', event.target.value)}
                          type="text"
                          value={entry.url}
                        />
                      </label>

                      <label className="bibliography-field__grid-span">
                        <span>Note</span>
                        <textarea
                          onChange={(event) => updateEntry(entryIndex, 'note', event.target.value)}
                          rows={3}
                          value={entry.note}
                        />
                      </label>
                    </div>

                    {([
                      ['authors', 'Authors'],
                      ['editors', 'Editors'],
                      ['translators', 'Translators'],
                    ] as const).map(([role, label]) => (
                      <section className="bibliography-field__people" key={`${entryIndex}-${role}`}>
                        <header className="bibliography-field__people-header">
                          <strong>{label}</strong>
                          <Button buttonStyle="secondary" onClick={() => addName(entryIndex, role)} size="small">
                            Add person
                          </Button>
                        </header>

                        {entry[role].length === 0 ? (
                          <p className="bibliography-field__people-empty">No {label.toLowerCase()} added.</p>
                        ) : null}

                        {entry[role].map((person, personIndex) => (
                          <div className="bibliography-field__person" key={`${role}-${personIndex}`}>
                            <label>
                              <span>Given</span>
                              <input
                                onChange={(event) =>
                                  updateName(entryIndex, role, personIndex, 'given', event.target.value)
                                }
                                type="text"
                                value={person.given}
                              />
                            </label>

                            <label>
                              <span>Family</span>
                              <input
                                onChange={(event) =>
                                  updateName(entryIndex, role, personIndex, 'family', event.target.value)
                                }
                                type="text"
                                value={person.family}
                              />
                            </label>

                            <label>
                              <span>Literal</span>
                              <input
                                onChange={(event) =>
                                  updateName(entryIndex, role, personIndex, 'literal', event.target.value)
                                }
                                type="text"
                                value={person.literal}
                              />
                            </label>

                            <Button
                              buttonStyle="secondary"
                              onClick={() => removeName(entryIndex, role, personIndex)}
                              size="small"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}

          <Button buttonStyle="secondary" className="bibliography-field__add-entry" onClick={addEntry} size="small">
            Add bibliography entry
          </Button>
        </div>
      )}
    </section>
  )
}
```

```scss
/* src/components/payload/bibliography-field.scss */
.bibliography-field {
  display: grid;
  gap: 1rem;
}

.bibliography-field__header,
.bibliography-field__warning,
.bibliography-field__empty,
.bibliography-field__entry,
.bibliography-field__meta {
  display: grid;
  gap: 0.75rem;
}

.bibliography-field__header,
.bibliography-field__entry-header,
.bibliography-field__people-header,
.bibliography-field__mode-switch {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.bibliography-field__entry-toggle,
.bibliography-field__upload {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--theme-text);
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-align: left;
}

.bibliography-field__meta {
  grid-template-columns: minmax(0, 1fr) auto;
}

.bibliography-field__meta-field,
.bibliography-field__raw,
.bibliography-field__grid label,
.bibliography-field__person label {
  display: grid;
  gap: 0.35rem;
}

.bibliography-field input,
.bibliography-field textarea,
.bibliography-field select {
  width: 100%;
}

.bibliography-field__entry-body,
.bibliography-field__grid,
.bibliography-field__people {
  display: grid;
  gap: 1rem;
}

.bibliography-field__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bibliography-field__grid-span {
  grid-column: 1 / -1;
}

.bibliography-field__person {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: end;
}

@media (max-width: 900px) {
  .bibliography-field__header,
  .bibliography-field__entry-header,
  .bibliography-field__people-header,
  .bibliography-field__meta,
  .bibliography-field__grid,
  .bibliography-field__person {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- [ ] **Step 4: Run the bibliography field test to verify it passes**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts tests/int/bibliography-field.int.spec.tsx
```

Expected: PASS with the structured entry hidden until the summary toggle is clicked.

- [ ] **Step 5: Commit**

```bash
git add src/components/payload/BibliographyField.tsx src/components/payload/bibliography-field.scss tests/int/bibliography-field.int.spec.tsx
git commit -m "feat: collapse bibliography entries in admin"
```

## Task 5: Regenerate Payload Artifacts and Run Final Verification

**Files:**
- Modify: `src/app/(payload)/admin/importMap.js`
- Modify: `src/payload-types.ts`

- [ ] **Step 1: Regenerate the import map and Payload types**

Run:

```bash
pnpm generate:importmap
pnpm generate:types
```

Expected:
- `generate:importmap` rewrites `src/app/(payload)/admin/importMap.js` with `PostTranslationManager` and `TranslatePostLocaleAction` component paths.
- `generate:types` updates `src/payload-types.ts` without schema errors.

- [ ] **Step 2: Run the targeted Vitest suite**

Run:

```bash
pnpm vitest run --config ./vitest.config.mts \
  tests/int/post-translation-summary.int.spec.ts \
  tests/int/post-translation-manager.int.spec.ts \
  tests/int/translate-post-locale-action.int.spec.tsx \
  tests/int/post-auto-translate-endpoint.int.spec.ts \
  tests/int/posts-admin-config.int.spec.ts \
  tests/int/bibliography-field.int.spec.tsx \
  tests/int/post-insights.int.spec.ts
```

Expected: PASS with all translation, admin config, bibliography, and overview tests green.

- [ ] **Step 3: Run the targeted admin e2e smoke tests**

Run:

```bash
pnpm playwright test --config playwright.config.ts tests/e2e/admin.e2e.spec.ts --grep "posts collection and create view|overview-first top-level workflow tabs"
```

Expected: PASS for the updated create-flow and post-edit-flow admin smoke coverage.

- [ ] **Step 4: Run TypeScript verification**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the generated artifacts and final wiring**

```bash
git add \
  "src/app/(payload)/admin/importMap.js" \
  src/payload-types.ts \
  vitest.setup.ts \
  src/collections/Posts.ts \
  src/components/payload/postTranslationSummary.ts \
  src/components/payload/PostTranslationManager.tsx \
  src/components/payload/TranslatePostLocaleAction.tsx \
  src/components/payload/post-translation-manager.scss \
  src/components/payload/BibliographyField.tsx \
  src/components/payload/bibliography-field.scss \
  tests/int/post-translation-summary.int.spec.ts \
  tests/int/post-translation-manager.int.spec.ts \
  tests/int/translate-post-locale-action.int.spec.tsx \
  tests/int/post-auto-translate-endpoint.int.spec.ts \
  tests/int/posts-admin-config.int.spec.ts \
  tests/int/bibliography-field.int.spec.tsx \
  tests/e2e/admin.e2e.spec.ts
git commit -m "feat: redesign post admin editing workflow"
```

## Spec Coverage Check

- `Overview` first and default: covered by Task 3 collection config and e2e assertions.
- Top-level `Core Content`, `Assets & References`, `Translation`, and `SEO`: covered by Task 3 collection config test and implementation.
- `Managed Resources` merged into `Core Content`: covered by Task 3 `ownedMedia` placement assertion.
- Locale-agnostic translation management: covered by Task 2 helper, server component, client action, and endpoint regression tests.
- Translation completion counts for `title`, `excerpt`, and `content`: covered by Task 1 helper tests and Task 2 server render tests.
- Bibliography entries collapsed by default and visually simplified: covered by Task 4 tests and styling changes.
- Payload artifact regeneration and type validation: covered by Task 5.

## Placeholder Scan

- No `TODO`, `TBD`, or deferred implementation notes remain in tasks.
- Every code-editing step contains concrete file paths and code blocks.
- Every test step includes an exact command and an expected failure or success mode.

## Type and Naming Consistency

- Translation manager helper exports `countTranslatedFields` and `buildTranslationLocaleRow`, and those same names are used consistently in tests and components.
- The new admin UI field path is consistently named `postTranslations`.
- The client action component is consistently named `TranslatePostLocaleAction`.
