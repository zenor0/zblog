# Article Layout Lab Design

**Date:** 2026-05-01

**Goal:** Create a development-only article layout lab that reuses the production article page and lets us compare mature long-form typography spacing presets against the current blog rendering.

## Scope

- Add a `/dev/article-layout` route.
- Reuse `PostArticle` so the lab exercises the real article header, reading column, Markdown renderer, media surface, table of contents, and supplementary layout.
- Add a floating development control panel that switches layout presets without changing production article pages.
- Add demo Markdown content that covers:
  - H2, H3, and H4 headings
  - dense and loose paragraphs
  - lists
  - blockquote
  - GitHub-style callout
  - labeled figure image
  - GFM table with caption
  - fenced code block
  - whitelisted `NoticeCard`
  - whitelisted `FeatureGrid`
- Register the lab in `/dev`.

## Non-Goals

- Do not change Payload schemas or generated Payload types.
- Do not make the production article page switchable.
- Do not introduce MDX or arbitrary rich-text execution.
- Do not replace the existing article-progress experiment.

## Research Signals

- Mature prose systems constrain line length. Tailwind Typography uses a `65ch` default max width; GOV.UK favors narrow content columns for readable service text; Practical Typography recommends keeping line length within a readable range rather than stretching full-width.
- Body text should have a stable line-height floor. WCAG text spacing guidance uses `line-height: 1.5` as a key readability threshold; Material-style body scales often sit near `16px / 24px`.
- Heading rhythm should bind headings to their following content. Tailwind Typography clears the first element margin after `h2`, `h3`, and `h4`, which prevents headings from visually floating between sections.
- Images, code blocks, tables, and callouts should be treated as interruptive article blocks with more deliberate spacing than ordinary paragraphs.

## Presets

### Current

No overrides. Shows the current production article rhythm.

### Prose Baseline

Uses a conservative prose-system rhythm:

- body max width around `65ch`
- `1rem` body text
- `1.75` line-height
- compact but readable heading margins
- rich blocks around `2em` vertical spacing
- heading-following content starts immediately after heading bottom spacing

### Editorial Balanced

Recommended candidate for this blog:

- body max width around `42rem`
- slightly larger body text for Chinese and mixed-language prose
- generous but not loose `1.8` line-height
- larger H2 section breaks, moderate H3 breaks, compact H4 breaks
- figures, code, callouts, and tables get stronger interruptive spacing
- captions remain close to media surfaces

### Dense Technical

Technical-note candidate:

- wider body width around `76ch`
- slightly smaller type and tighter line-height
- tighter section and block spacing
- code and tables become more visually efficient

## Architecture

- `articleLayoutPresets.ts` owns preset IDs and labels. It is safe for client imports.
- `articleLayoutDemo.ts` owns demo Markdown, demo post data, and media source overrides.
- `ArticleLayoutLabControls.tsx` is a client component that writes `data-article-layout-preset` to the document root and cleans it up on unmount.
- `page.tsx` renders the controls and production `PostArticle` with the demo post.
- `PostArticle` gains an optional `markdownMediaBySource` prop so dev pages can provide known media metadata and avoid a Local API lookup for demo-only remote images.
- `styles.css` defines preset-specific CSS under `html[data-article-layout-preset='...']` so no production page changes unless the dev control sets the attribute.

## Testing

- Add integration coverage that `/dev` registry exposes `article-layout`.
- Add integration coverage that the article layout demo contains the expected rich-text fixtures and that `MarkdownRenderer` renders the key article elements.
- Run targeted Vitest tests.
- Run `tsc --noEmit`.
- Start the local dev server and inspect `/dev/article-layout` with Playwright at desktop and mobile widths.

## Acceptance Criteria

1. `/dev/article-layout` renders a production-shaped article page.
2. The floating panel switches among Current, Prose Baseline, Editorial Balanced, and Dense Technical.
3. The demo content includes all currently supported rich-text block types relevant to layout evaluation.
4. Production article routes are unaffected unless a page explicitly sets the dev-only root data attribute.
5. TypeScript and targeted tests pass.
