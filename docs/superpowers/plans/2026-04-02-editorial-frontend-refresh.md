

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the public frontend so the homepage and article page adopt a restrained editorial visual language without changing content loading, Payload schemas, or the site’s reading workflow.

**Architecture:** Keep the existing Next.js route structure and Payload-backed data flow, but introduce a sharper editorial design system at the frontend layout and stylesheet level, then apply it to the homepage, article page, language switcher, table of contents, and footer. Use stable `data-*` hooks in the rendered markup so Playwright can lock the new structure before the visual refactor lands.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, `next/font/google`, Playwright

---

## File Map

- Modify: `tests/e2e/frontend.e2e.spec.ts`
  - Lock the new homepage and article structure with stable selectors before the visual refactor.
- Modify: `src/app/(frontend)/layout.tsx`
  - Own the public-site font pairing and expose a stable root shell hook for the editorial theme.
- Modify: `src/app/(frontend)/styles.css`
  - Define the editorial tokens, shared utility classes, article typography, toned-down semantic notices, and frontend-only surface styling.
- Modify: `src/app/(frontend)/[locale]/page.tsx`
  - Promote the first post into a featured slot and restructure the homepage into editorial hero plus index sections.
- Modify: `src/components/frontend/LocaleSwitcher.tsx`
  - Remove the heavy button treatment in favor of lighter editorial language controls that still work on mobile.
- Modify: `src/components/frontend/PostArticle.tsx`
  - Rebuild the article page into front matter, lead media, reading column, and appendix-style supplementary sections.
- Modify: `src/components/frontend/PostTableOfContents.tsx`
  - Turn the current panel into a lighter editorial index rail while preserving reading progress.
- Modify: `src/components/frontend/SiteFooter.tsx`
  - Replace badge-and-button-heavy footer presentation with text-led editorial metadata and links.

### Task 1: Lock the redesign surface with failing frontend checks

**Files:**
- Modify: `tests/e2e/frontend.e2e.spec.ts`

- [ ] **Step 1: Add homepage structure assertions**

Extend the homepage test so it expects the new editorial hooks that the implementation will add.

```ts
test('can go on homepage', async ({ page }) => {
  await page.goto('http://localhost:3000')

  await expect(page).toHaveURL(/http:\/\/localhost:3000\/(en|zh-hans)$/)
  await expect(page).toHaveTitle(/ZBlog/)
  await expect(page.locator('[data-editorial-shell="true"]')).toBeVisible()
  await expect(page.locator('[data-home-hero]')).toBeVisible()
  await expect(page.locator('[data-home-featured-post]')).toBeVisible()
  await expect(page.locator('[data-home-post-list]')).toBeVisible()
  await expect(page.locator('[data-home-post-list] article').first()).toBeVisible()
})
```

- [ ] **Step 2: Add article structure assertions**

Tighten the seeded article tests so they verify the new front matter, reading column, supplementary area, and TOC rail hooks.

```ts
test('can render a seeded article with references and history link', async ({ page }) => {
  await page.goto('http://localhost:3000/zh-hans/posts/seed-citation-demo')

  await expect(page.locator('[data-article-frontmatter]')).toBeVisible()
  await expect(page.locator('[data-article-reading-column]')).toBeVisible()
  await expect(page.locator('[data-article-supplementary]')).toBeVisible()
  await expect(page.locator('[data-toc-rail]')).toBeVisible()
  await expect(page.locator('[data-post-reading-root]')).toBeVisible()
  await expect(page.getByRole('link', { name: '版本历史' })).toBeVisible()
})
```

- [ ] **Step 3: Run Playwright to verify the test goes red**

Run: `pnpm playwright test --config=playwright.config.ts tests/e2e/frontend.e2e.spec.ts --grep "can go on homepage|can render a seeded article with references and history link"`

Expected: FAIL because the new `data-*` selectors do not exist yet.

- [ ] **Step 4: Commit the red test lock**

```bash
git add tests/e2e/frontend.e2e.spec.ts
git commit -m "test: lock editorial frontend structure"
```

### Task 2: Establish the shared editorial theme primitives

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/app/(frontend)/styles.css`

- [ ] **Step 1: Refresh the frontend font shell**

Update the public frontend layout to expose an editorial root shell and use a less technical body font. Keep the serif display font, and use explicit CJK fallbacks in CSS rather than adding a heavy CJK webfont package.

```tsx
import { Newsreader, Source_Sans_3 } from 'next/font/google'
import React from 'react'

import './styles.css'

const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans-ui',
  weight: ['400', '500', '600'],
})

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif-display',
  weight: ['400', '500', '600', '700'],
})

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <div className={`${sans.variable} ${serif.variable}`} data-editorial-shell="true">
      <main>{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Replace the frontend tokens and shared editorial helpers**

Rewrite the frontend stylesheet so the public shell is crisp, white, sharp-cornered, and type-led. Add reusable helpers instead of scattering one-off class soups through every component.

```css
:root {
  --radius: 0rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.24 0.008 40);
  --card: oklch(0.995 0 0);
  --card-foreground: oklch(0.24 0.008 40);
  --primary: oklch(0.24 0.008 40);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.97 0.002 95);
  --secondary-foreground: oklch(0.34 0.008 40);
  --muted: oklch(0.975 0.002 95);
  --muted-foreground: oklch(0.52 0.01 45);
  --accent: oklch(0.965 0.002 95);
  --accent-foreground: oklch(0.24 0.008 40);
  --border: oklch(0.9 0.003 95);
}

@layer base {
  body {
    @apply min-h-screen bg-background text-foreground;
    font-family:
      var(--font-sans-ui),
      "Source Sans 3",
      "Noto Sans SC",
      "PingFang SC",
      "Hiragino Sans GB",
      sans-serif;
  }
}

@layer components {
  .page-frame {
    @apply mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12;
  }

  .frontend-shell {
    @apply pb-16 pt-8 sm:pb-24 sm:pt-10;
  }

  .section-kicker,
  .editorial-meta {
    @apply text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground;
  }

  .editorial-link {
    @apply text-foreground underline decoration-border/90 underline-offset-[0.22em] transition-colors hover:text-foreground/72;
  }

  .editorial-frame {
    @apply border border-border bg-background;
  }
}
```

- [ ] **Step 3: Tune article copy and semantic notices to match the new tone**

Keep the current markdown features, but make prose calmer and notices less product-like. This stays in the shared stylesheet so homepage and article modules inherit one vocabulary.

```css
@layer components {
  .article-copy {
    @apply text-[1.02rem] leading-8 text-foreground/88 sm:text-[1.05rem];
  }

  .article-copy h2 {
    @apply mt-14 font-serif text-3xl tracking-[-0.03em] text-foreground sm:text-4xl;
  }

  .article-copy blockquote {
    @apply border-l border-border pl-5 text-foreground/74 italic;
  }

  .md-callout {
    @apply my-8 border border-border bg-muted/40 px-5 py-4 text-sm text-foreground/82;
  }

  .md-callout--warning {
    @apply border-amber-300 bg-amber-50/45 text-amber-950;
  }
}
```

- [ ] **Step 4: Run TypeScript to confirm the theme shell still builds**

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 5: Commit the theme primitives**

```bash
git add src/app/'(frontend)'/layout.tsx src/app/'(frontend)'/styles.css
git commit -m "style: add editorial frontend theme primitives"
```

### Task 3: Redesign the homepage and lighten the locale switcher

**Files:**
- Modify: `src/app/(frontend)/[locale]/page.tsx`
- Modify: `src/components/frontend/LocaleSwitcher.tsx`
- Modify: `src/app/(frontend)/styles.css`

- [ ] **Step 1: Restructure the homepage around hero, featured post, and index list**

Split the first post from the rest, add stable hooks for Playwright, and turn the homepage into an editorial cover plus issue index.

```tsx
const featuredPost = posts[0] ?? null
const remainingPosts = posts.slice(1)

return (
  <>
    <script
      dangerouslySetInnerHTML={{
        __html: serializeStructuredData(structuredData),
      }}
      type="application/ld+json"
    />
    <div className="page-frame frontend-shell">
      <header
        className="grid gap-8 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
        data-home-hero=""
      >
        <div className="flex max-w-4xl flex-col gap-4">
          <p className="section-kicker">{heroEyebrow}</p>
          <h1 className="max-w-4xl font-serif text-6xl leading-none tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
            {heroTitle}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            {heroDescription}
          </p>
        </div>
        <div className="flex flex-col gap-5 lg:items-end">
          <LocaleSwitcher
            activeLocale={locale}
            items={buildLocaleLinks('')}
            label={common('localeNavigation')}
          />
          <p className="editorial-meta">{home('publishedEntries', { count: posts.length })}</p>
        </div>
      </header>
      {posts.length === 0 ? (
        <p className="max-w-2xl py-12 text-base leading-8 text-foreground/68">
          {home('noPublishedPosts')}
        </p>
      ) : (
        <>
          {featuredPost ? (
            <article
              className="grid gap-6 border-b border-border py-10 lg:grid-cols-[minmax(0,1fr)_19rem]"
              data-home-featured-post=""
              key={featuredPost.id}
            >
              <div className="flex min-w-0 flex-col gap-4">
                <p className="editorial-meta">
                  {formatShortDate({
                    fallback: common('unknownDate'),
                    locale,
                    value: featuredPost.publishedAt ?? featuredPost.updatedAt,
                  })}
                </p>
                <h2 className="font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">
                  <Link className="editorial-link no-underline" href={buildLocalePath(locale, `/posts/${featuredPost.slug}`)}>
                    {featuredPost.title}
                  </Link>
                </h2>
              </div>
            </article>
          ) : null}
          <section className="pt-8" data-home-post-list="">
            {remainingPosts.map((post) => (
              <article className="grid gap-4 border-b border-border py-6 md:grid-cols-[minmax(0,1fr)_14rem]" key={post.id}>
                <div className="flex min-w-0 flex-col gap-2">
                  <p className="editorial-meta">
                    {formatShortDate({
                      fallback: common('unknownDate'),
                      locale,
                      value: post.publishedAt ?? post.updatedAt,
                    })}
                  </p>
                  <h2 className="font-serif text-2xl leading-tight tracking-[-0.03em]">
                    <Link className="editorial-link no-underline" href={buildLocalePath(locale, `/posts/${post.slug}`)}>
                      {post.title}
                    </Link>
                  </h2>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  </>
)
```

- [ ] **Step 2: Replace the locale switcher’s button-heavy presentation**

Desktop should render language choices as light editorial controls, while mobile keeps the sheet interaction but tones down its trigger and item styling.

```tsx
return (
  <div className={cn('flex items-center justify-end', className)} data-locale-switcher="">
    <div className="hidden flex-wrap items-center gap-3 sm:flex">
      {items.map((item, index) => (
        <React.Fragment key={item.locale}>
          {index > 0 ? <span className="text-border">/</span> : null}
          <Link
            className={cn(
              'editorial-meta transition-colors hover:text-foreground',
              item.locale === activeLocale && 'text-foreground',
            )}
            href={item.href}
          >
            {item.label}
          </Link>
        </React.Fragment>
      ))}
    </div>

    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          className="h-auto border border-border px-3 py-2 text-[11px] uppercase tracking-[0.24em] sm:hidden"
          size="sm"
          variant="ghost"
        >
          <LanguagesIcon data-icon="inline-start" />
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent className="border-l border-border bg-background" side="right">
        <SheetHeader className="gap-2 border-b border-border pb-4">
          <SheetTitle className="font-serif text-2xl tracking-[-0.02em] text-foreground">
            {label}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            {activeItem?.label ?? label}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          {items.map((item) => (
            <Link
              className={cn(
                'border-b border-border pb-3 text-base text-foreground/78 transition-colors hover:text-foreground',
                item.locale === activeLocale && 'text-foreground',
              )}
              href={item.href}
              key={item.locale}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  </div>
)
```

- [ ] **Step 3: Add the homepage-specific editorial helpers**

Use the shared stylesheet to hold homepage-only helpers for featured media, list rhythm, and muted metadata instead of hard-coding every rule in JSX.

```css
@layer components {
  [data-home-featured-post] .media-surface--card {
    @apply aspect-[4/5];
  }

  [data-home-post-list] article:last-child {
    @apply border-b-0;
  }

  [data-locale-switcher] [data-slot='sheet-content'] {
    @apply border-l border-border bg-background;
  }
}
```

- [ ] **Step 4: Run the homepage Playwright check**

Run: `pnpm playwright test --config=playwright.config.ts tests/e2e/frontend.e2e.spec.ts --grep "can go on homepage"`

Expected: PASS

- [ ] **Step 5: Commit the homepage refactor**

```bash
git add src/app/'(frontend)'/'[locale]'/page.tsx src/components/frontend/LocaleSwitcher.tsx src/app/'(frontend)'/styles.css
git commit -m "feat: redesign the homepage in editorial style"
```

### Task 4: Rebuild the article page as editorial front matter plus reading rail

**Files:**
- Modify: `src/components/frontend/PostArticle.tsx`
- Modify: `src/components/frontend/PostTableOfContents.tsx`
- Modify: `src/app/(frontend)/styles.css`

- [ ] **Step 1: Reframe the article layout and front matter**

Add stable hooks for the new structure, reduce badge dominance, and move the visual weight into title, excerpt, and lead media.

```tsx
<article
  className={cn(
    'grid gap-10',
    tocHeadings.length > 0 && 'xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-10',
  )}
  data-article-layout=""
>
  <div className="flex min-w-0 flex-col gap-8" data-article-reading-column="">
    <header className="flex flex-col gap-6 border-b border-border pb-10" data-article-frontmatter="">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>
          {formatLongDate({
            fallback: common('unscheduled'),
            locale: resolved.resolvedLocale,
            value: post.publishedAt ?? post.updatedAt,
          })}
        </span>
        <span>{article('readingTime', { minutes: estimateReadingMinutes(post.content) })}</span>
        <span>{getLocaleLabel(resolved.resolvedLocale)}</span>
        {historyHref ? <Link className="editorial-link no-underline" href={historyHref}>{article('versionHistory')}</Link> : null}
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
  </div>
</article>
```

- [ ] **Step 2: Tone down notices, tags, attachments, and references into appendix-style blocks**

Keep all current data, but stop rendering them like default UI library widgets. Apply consistent section dividers and compact metadata rows.

```tsx
{hasSupplementaryContent ? (
  <div className="flex flex-col gap-10 border-t border-border pt-10" data-article-supplementary="">
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
      </div>
    ) : null}
    {post.tags?.length ? (
      <section className="flex flex-col gap-3">
        <p className="section-kicker">{common('tags')}</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              key={tag.id ?? tag.value}
            >
              {tag.value}
            </span>
          ))}
        </div>
      </section>
    ) : null}
    {bibliographyEntries.length ? (
      <section className="flex flex-col gap-3">
        <p className="section-kicker">{common('references')}</p>
      </section>
    ) : null}
  </div>
) : null}
```

- [ ] **Step 3: Replace the TOC panel with a lighter index rail**

Keep the progress logic, but remove rounded cards and make the rail read like an index in the margin.

```tsx
return (
  <section className="flex min-w-0 flex-col gap-4 border-t border-border pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0" data-toc-rail="">
    <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="section-kicker">{progressLabel}</p>
        <h2 className="font-serif text-xl tracking-[-0.02em] text-foreground">{label}</h2>
      </div>
      <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{progress}%</span>
    </div>
    <nav aria-label={label} className="max-h-[min(62vh,32rem)] overflow-y-auto pr-1">
      <ol className="flex flex-col gap-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              aria-current={activeID === heading.id ? 'location' : undefined}
              className={cn(
                'block min-w-0 border-l border-transparent pl-3 text-[13px] leading-5 text-foreground/62 wrap-anywhere transition-colors hover:border-border hover:text-foreground',
                heading.depth === 3 && 'ml-3',
                heading.depth >= 4 && 'ml-5',
                activeID === heading.id && 'border-foreground text-foreground',
              )}
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  </section>
)
```

- [ ] **Step 4: Run the article Playwright checks**

Run: `pnpm playwright test --config=playwright.config.ts tests/e2e/frontend.e2e.spec.ts --grep "can render a seeded article with references and history link|can render the seeded markdown showcase article"`

Expected: PASS

- [ ] **Step 5: Commit the article refactor**

```bash
git add src/components/frontend/PostArticle.tsx src/components/frontend/PostTableOfContents.tsx src/app/'(frontend)'/styles.css
git commit -m "feat: restyle article reading pages"
```

### Task 5: Restyle the footer to match the editorial system

**Files:**
- Modify: `src/components/frontend/SiteFooter.tsx`
- Modify: `src/app/(frontend)/styles.css`

- [ ] **Step 1: Remove badge and button treatments from the footer**

Render the footer as editorial metadata and text links rather than chip collections and inline buttons.

```tsx
return (
  <footer className="mt-16 border-t border-border" data-site-footer="">
    <div className="page-frame py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex flex-col gap-3">
          <p className="section-kicker">{settings.siteName}</p>
          {hasText(note) ? (
            <p className="max-w-2xl font-serif text-2xl leading-9 tracking-[-0.025em] text-foreground/90 sm:text-3xl">
              {note}
            </p>
          ) : null}
        </div>
        {metaItems.length ? (
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {metaItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
      {records.length ? (
        <dl className="mt-8 grid gap-x-8 gap-y-3 border-t border-border pt-6 sm:grid-cols-2">
          {records.map((item) => (
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2" key={item.id ?? `${item.label}-${item.value}`}>
              <dt className="editorial-meta">{item.label}</dt>
              <dd className="text-sm text-foreground/82">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {links.length ? (
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6">
          {links.map((item) => (
            <Link
              className="editorial-link no-underline"
              href={item.href}
              key={item.id ?? `${item.label}-${item.href}`}
              rel="noreferrer"
              target="_blank"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  </footer>
)
```

- [ ] **Step 2: Add footer-only helper rules for links and record layout**

Keep footer styling in the frontend stylesheet so the layout stays consistent across locales.

```css
@layer components {
  [data-site-footer] a {
    @apply editorial-link no-underline;
  }

  [data-site-footer] dl + div {
    @apply mt-6 border-t border-border pt-6;
  }
}
```

- [ ] **Step 3: Run the homepage smoke test again**

Run: `pnpm playwright test --config=playwright.config.ts tests/e2e/frontend.e2e.spec.ts --grep "can go on homepage"`

Expected: PASS

- [ ] **Step 4: Commit the footer restyle**

```bash
git add src/components/frontend/SiteFooter.tsx src/app/'(frontend)'/styles.css
git commit -m "feat: restyle the frontend footer"
```

### Task 6: Verify the full frontend flow and ship the refresh

**Files:**
- Modify: `tests/e2e/frontend.e2e.spec.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/app/(frontend)/styles.css`
- Modify: `src/app/(frontend)/[locale]/page.tsx`
- Modify: `src/components/frontend/LocaleSwitcher.tsx`
- Modify: `src/components/frontend/PostArticle.tsx`
- Modify: `src/components/frontend/PostTableOfContents.tsx`
- Modify: `src/components/frontend/SiteFooter.tsx`
- Modify: `docs/superpowers/plans/2026-04-02-editorial-frontend-refresh.md`

- [ ] **Step 1: Run TypeScript validation**

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 2: Run the full frontend Playwright suite**

Run: `pnpm playwright test --config=playwright.config.ts tests/e2e/frontend.e2e.spec.ts`

Expected: PASS

- [ ] **Step 3: Review the final diff for accidental admin-side bleed**

Run: `git diff --stat HEAD~5..HEAD`

Expected: only the frontend routes, shared frontend stylesheet, frontend components, and the e2e spec appear in the diff.

- [ ] **Step 4: Commit the completed refresh**

```bash
git add tests/e2e/frontend.e2e.spec.ts src/app/'(frontend)'/layout.tsx src/app/'(frontend)'/styles.css src/app/'(frontend)'/'[locale]'/page.tsx src/components/frontend/LocaleSwitcher.tsx src/components/frontend/PostArticle.tsx src/components/frontend/PostTableOfContents.tsx src/components/frontend/SiteFooter.tsx docs/superpowers/plans/2026-04-02-editorial-frontend-refresh.md
git commit -m "feat: refresh frontend with editorial styling"
```
