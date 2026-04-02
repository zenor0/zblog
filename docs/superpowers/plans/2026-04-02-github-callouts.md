# GitHub Callouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace directive-style Markdown callouts with GitHub-style blockquote callouts, support case-insensitive and custom labels, and refresh the frontend styling so semantic differences are visible.

**Architecture:** Keep the existing `react-markdown` pipeline, but replace directive callout handling with a blockquote AST pass that recognizes GitHub callout markers and annotates nodes for the renderer. Render callouts through the existing `aside` hook in the Markdown renderer, then update shared frontend CSS and editor-facing sample content to match the new syntax.

**Tech Stack:** React, react-markdown, remark-gfm, remark-directive, TypeScript, Vitest

---

### Task 1: Lock GitHub callout behavior with failing tests

**Files:**
- Modify: `tests/int/markdown-renderer.int.spec.ts`
- Modify: `tests/int/seed-blog-content.int.spec.ts`

- [ ] **Step 1: Add failing renderer assertions**

Add tests that cover a known GitHub label, lowercase matching, custom-label fallback, multi-paragraph content, and preservation of ordinary blockquotes.

```ts
it('renders GitHub callouts case-insensitively', () => {
  const html = renderMarkdown(`
> [!note]
> Lowercase markers should still render.
`)

  expect(html).toContain('md-callout--note')
  expect(html).toContain('data-callout-label="Note"')
})
```

- [ ] **Step 2: Add failing seed-content assertions**

Update the showcase-content test so it expects `> [!NOTE]` and `> [!WARNING]` instead of the removed directive syntax.

```ts
expect(content).toContain('> [!NOTE]')
expect(content).toContain('> [!WARNING]')
expect(content).not.toContain(':::note')
```

- [ ] **Step 3: Run tests to verify red**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-renderer.int.spec.ts tests/int/seed-blog-content.int.spec.ts`

Expected: FAIL because the renderer still only understands directive callouts and the seed content still emits `:::note`.

### Task 2: Replace directive parsing with GitHub callout parsing

**Files:**
- Modify: `src/lib/markdown/plugins.ts`
- Modify: `src/lib/markdown/index.tsx`

- [ ] **Step 1: Implement callout parsing helpers and AST annotation**

Add blockquote-based detection that strips the `[!label]` marker, normalizes known labels, preserves custom labels, and annotates the node with the callout metadata used by the renderer.

```ts
const knownCalloutKinds = new Set(['note', 'tip', 'important', 'warning', 'caution'])

function normalizeCalloutLabel(value: string) {
  const normalized = value.trim().toLowerCase()

  return {
    displayLabel: normalized.replace(/\b\w/g, (char) => char.toUpperCase()),
    kind: normalized || 'note',
    isKnown: knownCalloutKinds.has(normalized),
  }
}
```

- [ ] **Step 2: Update the Markdown renderer**

Teach the `aside` renderer to emit a title row with icon and label metadata while leaving ordinary blockquotes untouched.

```tsx
aside: ({ children, className, node, ...rest }: any) => {
  const label = typeof rest['data-callout-label'] === 'string' ? rest['data-callout-label'] : null

  return (
    <aside {...rest} className={className}>
      {label ? <div className="md-callout__title">{label}</div> : null}
      {children}
    </aside>
  )
},
```

- [ ] **Step 3: Run focused renderer tests**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 3: Refresh callout visuals and authored content

**Files:**
- Modify: `src/app/(frontend)/styles.css`
- Modify: `src/collections/Posts.ts`
- Modify: `src/lib/seed-blog-content.ts`

- [ ] **Step 1: Update shared callout styles**

Replace the minimal border-only callout styles with GitHub-like structural styles and semantic variants.

```css
.md-callout {
  @apply my-6 rounded-md border px-4 py-3;
}

.md-callout__title {
  @apply mb-2 flex items-center gap-2 text-sm font-semibold;
}
```

- [ ] **Step 2: Update editor help text and seed examples**

Switch author guidance and seeded examples from `:::note` syntax to `> [!NOTE]` style callouts.

```ts
description:
  'Markdown is supported here, including GitHub-style callouts via > [!NOTE], fenced code, tables, and citations via [@citation-key].'
```

- [ ] **Step 3: Run seed and renderer tests**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/seed-blog-content.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 4: Verify TypeScript and Markdown integration

**Files:**
- Modify: `tests/int/markdown-renderer.int.spec.ts`
- Modify: `tests/int/seed-blog-content.int.spec.ts`
- Modify: `src/lib/markdown/plugins.ts`
- Modify: `src/lib/markdown/index.tsx`
- Modify: `src/app/(frontend)/styles.css`
- Modify: `src/collections/Posts.ts`
- Modify: `src/lib/seed-blog-content.ts`

- [ ] **Step 1: Run TypeScript verification**

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 2: Run focused Markdown verification**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-syntax.int.spec.ts tests/int/markdown-renderer.int.spec.ts tests/int/seed-blog-content.int.spec.ts`

Expected: PASS

- [ ] **Step 3: Commit the feature branch work**

```bash
git add tests/int/markdown-renderer.int.spec.ts tests/int/seed-blog-content.int.spec.ts src/lib/markdown/plugins.ts src/lib/markdown/index.tsx src/app/'(frontend)'/styles.css src/collections/Posts.ts src/lib/seed-blog-content.ts docs/superpowers/plans/2026-04-02-github-callouts.md
git commit -m "feat: add GitHub-style markdown callouts"
```
