# Markdown Renderable Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localized figure/table labels and controlled JSX-like Markdown components to the frontend renderer, then expose both capabilities in the seeded showcase article.

**Architecture:** Reuse the split Markdown pipeline, add a lightweight preprocess step for JSX-like whitelist tags, render them through directive nodes and explicit React component mappings, and pass locale-specific figure/table labels from the article page into the renderer.

**Tech Stack:** React, react-markdown, remark-directive, TypeScript, Vitest, Playwright

---

### Task 1: Lock new behavior with tests

**Files:**
- Modify: `tests/int/markdown-renderer.int.spec.ts`
- Modify: `tests/int/markdown-syntax.int.spec.ts`
- Modify: `tests/int/seed-blog-content.int.spec.ts`
- Modify: `tests/e2e/frontend.e2e.spec.ts`

- [ ] **Step 1: Add failing renderer assertions**

Cover localized `Figure/Table` labels plus rendered whitelist components.

- [ ] **Step 2: Add failing syntax and seed assertions**

Cover JSX-like preprocessing and rendered-component examples in the seed article content.

- [ ] **Step 3: Run focused tests to confirm red**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-syntax.int.spec.ts tests/int/seed-blog-content.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: FAIL before implementation is complete.

### Task 2: Implement localized labels and controlled components

**Files:**
- Modify: `src/lib/markdown/article-syntax.ts`
- Modify: `src/lib/markdown/plugins.ts`
- Modify: `src/lib/markdown/index.tsx`
- Modify: `src/lib/markdown/types.ts`
- Modify: `src/components/frontend/PostArticle.tsx`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/zh-Hans.json`
- Create: `src/components/frontend/markdown-components/NoticeCard.tsx`
- Create: `src/components/frontend/markdown-components/FeatureGrid.tsx`

- [ ] **Step 1: Finish the preprocess and directive pipeline**

Rewrite whitelist JSX-like blocks into directive syntax and map them onto React components.

- [ ] **Step 2: Thread localized labels through the renderer**

Use locale-specific `fig` / `tbl` strings for captions and cross-references.

- [ ] **Step 3: Run focused renderer tests**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 3: Update the showcase and verify the integrated flow

**Files:**
- Modify: `src/lib/seed-blog-content.ts`
- Modify: `src/scripts/seed-blog.ts`

- [ ] **Step 1: Update showcase content**

Demonstrate rendered components while retaining figures, tables, citations, callouts, and fenced `tsx` code.

- [ ] **Step 2: Run project verification**

Run:
- `pnpm run generate:importmap`
- `pnpm exec tsc --noEmit`
- `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-syntax.int.spec.ts tests/int/seed-blog-content.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

- [ ] **Step 3: Run frontend e2e after seeding**

Run:
- `pnpm run seed:blog`
- `pnpm playwright test --config=playwright.config.ts tests/e2e/frontend.e2e.spec.ts`

Expected: PASS
