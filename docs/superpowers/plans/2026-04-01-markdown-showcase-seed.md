# Markdown Showcase Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated seeded article that demonstrates the blog frontend's current Markdown feature set without disturbing the existing citation/version-history seed post.

**Architecture:** Extract seeded article content builders into a reusable module so the seed script and tests both depend on the same source of truth. Add one new showcase post in the seed script, keep the current seed posts intact, and extend frontend expectations to cover the new article's rendered features.

**Tech Stack:** TypeScript, Payload seed script, Vitest, Playwright

---

### Task 1: Lock showcase content requirements with a failing test

**Files:**
- Create: `tests/int/seed-blog-content.int.spec.ts`
- Create: `src/lib/seed-blog-content.ts`

- [ ] **Step 1: Write the failing test**

Add a Vitest spec that asserts the showcase content builder returns Markdown containing labeled figures, captioned tables, `tsx` fenced code blocks, citations, and callouts.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/seed-blog-content.int.spec.ts`

Expected: FAIL because the content builder does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the shared content-builder module and implement the new showcase content functions plus exported slug/title constants.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/seed-blog-content.int.spec.ts`

Expected: PASS

### Task 2: Seed the new showcase article

**Files:**
- Modify: `src/scripts/seed-blog.ts`
- Modify: `src/lib/seed-blog-content.ts`

- [ ] **Step 1: Extend seed cleanup and summary**

Ensure the new showcase slug is deleted before reseeding and appears in the script summary output.

- [ ] **Step 2: Create the showcase post**

Seed a new published post using the shared showcase content, reusing existing hero and bibliography assets.

- [ ] **Step 3: Add localized content**

Seed both `zh-Hans` and `en` locales for the showcase article so it appears in the frontend article list consistently.

- [ ] **Step 4: Run focused tests**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/seed-blog-content.int.spec.ts tests/int/content-utils.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 3: Extend frontend expectations

**Files:**
- Modify: `tests/e2e/frontend.e2e.spec.ts`

- [ ] **Step 1: Add showcase article expectations**

Assert the homepage exposes the new article and add a dedicated article-page check for figure/table/code rendering.

- [ ] **Step 2: Run TypeScript verification**

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Run the integration suite**

Run: `pnpm run test:int`

Expected: PASS
