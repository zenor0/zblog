# Article Layout Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a development-only article layout lab for comparing long-form typography and rich-text spacing presets on the real article renderer.

**Architecture:** The lab is isolated under `/dev/article-layout`. A server page renders the real `PostArticle` using demo content, while a small client control sets a root data attribute that activates CSS-only layout presets. `PostArticle` gets one optional media override prop so the lab can render inline demo images without requiring database media records.

**Tech Stack:** Next.js App Router, React 19, Payload CMS types, react-markdown, shadcn `Button`, Tailwind v4 global CSS, Vitest.

---

### Task 1: Tests

**Files:**
- Modify: `tests/int/dev-reference-registry.int.spec.ts`
- Create: `tests/int/article-layout-lab.int.spec.tsx`

- [ ] **Step 1: Write failing registry coverage**

Add expectations that `article-layout` is present in the experiments section and points to `/dev/article-layout`.

- [ ] **Step 2: Write failing demo coverage**

Create a test that imports the lab demo model, renders `articleLayoutDemoContent` through `MarkdownRenderer`, and asserts that the fixture covers headings, callouts, figures, tables, code blocks, `NoticeCard`, and `FeatureGrid`.

- [ ] **Step 3: Run the targeted tests and verify RED**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dev-reference-registry.int.spec.ts tests/int/article-layout-lab.int.spec.tsx
```

Expected: fail because `article-layout` is not registered and the lab model does not exist yet.

### Task 2: Lab Model And Route

**Files:**
- Create: `src/app/(frontend)/dev/article-layout/articleLayoutPresets.ts`
- Create: `src/app/(frontend)/dev/article-layout/articleLayoutDemo.ts`
- Create: `src/app/(frontend)/dev/article-layout/page.tsx`
- Modify: `src/lib/dev-reference.ts`
- Modify: `src/components/frontend/PostArticle.tsx`

- [ ] **Step 1: Add preset metadata**

Define four presets: `current`, `prose-baseline`, `editorial-balanced`, and `dense-technical`.

- [ ] **Step 2: Add demo article data**

Create demo Markdown content covering the required rich-text elements and export a `ResolvedPost` fixture.

- [ ] **Step 3: Register the dev page**

Add an `article-layout` item to the experiments section in `src/lib/dev-reference.ts`.

- [ ] **Step 4: Add optional markdown media overrides**

Extend `PostArticle` with an optional `markdownMediaBySource` prop and skip Local API lookup for sources already provided by the caller.

- [ ] **Step 5: Add the page**

Render `PostArticle` with the demo post and the markdown media override map.

### Task 3: Floating Controls And CSS Presets

**Files:**
- Create: `src/app/(frontend)/dev/article-layout/ArticleLayoutLabControls.tsx`
- Modify: `src/app/(frontend)/dev/article-layout/page.tsx`
- Modify: `src/app/(frontend)/styles.css`

- [ ] **Step 1: Add client controls**

Create a compact fixed panel with buttons for each preset. On selection, write the preset ID to `document.documentElement.dataset.articleLayoutPreset`; remove it on unmount.

- [ ] **Step 2: Add preset CSS**

Add CSS selectors scoped to `html[data-article-layout-preset='prose-baseline']`, `html[data-article-layout-preset='editorial-balanced']`, and `html[data-article-layout-preset='dense-technical']`.

- [ ] **Step 3: Keep Current unmodified**

The `current` preset should set the data attribute but not override production article styles.

### Task 4: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run targeted Vitest**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/dev-reference-registry.int.spec.ts tests/int/article-layout-lab.int.spec.tsx
```

Expected: pass.

- [ ] **Step 2: Run TypeScript**

```bash
pnpm exec tsc --noEmit
```

Expected: pass.

- [ ] **Step 3: Inspect visually**

Start or reuse a local dev server and inspect `/dev/article-layout` with Playwright at desktop and mobile widths. Confirm the article renders, the controls are visible, and switching presets changes `.article-copy` layout.
