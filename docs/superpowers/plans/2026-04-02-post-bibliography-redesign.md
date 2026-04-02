# Post Bibliography Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace reusable bibliography resources with a post-owned embedded bibliography model and ship a two-mode admin editor backed by a single `BibTeX` source field.

**Architecture:** Move bibliography storage into `Posts` as a non-localized group, refactor bibliography utilities to parse and serialize embedded source text, then rewire validation, frontend loading, admin insights, import flows, and tests to use the new model. The admin experience uses a custom client field that edits structured entries when safe and always preserves a raw `BibTeX` fallback.

**Tech Stack:** Payload CMS 3, Next.js, React 19, TypeScript, Vitest, Playwright, `biblatex-csl-converter`

---

### Task 1: Lock the embedded bibliography contract with failing tests

**Files:**
- Modify: `tests/int/content-utils.int.spec.ts`
- Modify: `tests/int/api.int.spec.ts`
- Modify: `tests/int/markdown-renderer.int.spec.ts`

- [ ] **Step 1: Write the failing tests**

Add coverage for parsing bibliography directly from a `{ source }` object, validating post saves against embedded bibliography data, and rendering references without a relationship document.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts tests/int/content-utils.int.spec.ts tests/int/api.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: FAIL because posts still expect `bibliographyFile` relationships and the admin/runtime code cannot yet use embedded bibliography fields.

- [ ] **Step 3: Write the minimal implementation for the tested contract**

Refactor bibliography utilities and post-loading helpers so tests can target embedded `{ filename, source }` data without touching standalone bibliography documents.

- [ ] **Step 4: Re-run the focused tests**

Run: `PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts tests/int/content-utils.int.spec.ts tests/int/api.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 2: Replace the schema and delete bibliography resources

**Files:**
- Modify: `src/collections/Posts.ts`
- Modify: `src/payload.config.ts`
- Delete: `src/collections/BibliographyFiles.ts`
- Modify: `src/lib/post-owned-resources.ts`
- Modify: `src/hooks/posts/captureOwnedResourcesBeforeDelete.ts`
- Modify: `src/hooks/posts/deleteOwnedResourcesAfterDelete.ts`
- Modify: `src/components/payload/PostInsights.tsx`

- [ ] **Step 1: Write the failing tests for schema-driven behavior**

Add or extend tests to prove posts save and delete correctly when bibliography lives on the post itself and bibliography resource cleanup no longer exists.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts`

Expected: FAIL because the Payload schema still registers `bibliography-files` and the related cleanup/insights logic still assumes bibliography resources exist.

- [ ] **Step 3: Implement the schema cutover**

Embed `bibliography.filename` and `bibliography.source` in the post References tab, remove `bibliography-files` from the Payload config, and strip bibliography-specific ownership, cleanup, and insights code.

- [ ] **Step 4: Re-run the focused API tests**

Run: `PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts`

Expected: PASS

### Task 3: Build the two-mode admin bibliography editor

**Files:**
- Create: `src/components/payload/BibliographyField.tsx`
- Create: `src/components/payload/bibliography-field.scss`
- Modify: `src/collections/Posts.ts`
- Modify: `src/lib/bibliography.ts`
- Test: `tests/int/content-utils.int.spec.ts`

- [ ] **Step 1: Write the failing tests for structured editing primitives**

Add serialization and safe-round-trip tests for structured bibliography entries, including fallback detection for unsupported source shapes.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-utils.int.spec.ts`

Expected: FAIL because bibliography utilities do not yet expose safe structured-editing helpers or `BibTeX` serialization.

- [ ] **Step 3: Implement the minimal structured editor stack**

Add utility helpers for editable bibliography entries, create the admin field component with `Structured` and `Raw BibTeX` modes, wire file upload into `bibliography.source`, and keep raw mode as the universal fallback.

- [ ] **Step 4: Re-run the focused tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/content-utils.int.spec.ts`

Expected: PASS

### Task 4: Rewire import, seeds, and frontend runtime to the embedded model

**Files:**
- Modify: `src/lib/posts.ts`
- Modify: `src/lib/post-package-import.ts`
- Modify: `src/components/payload/PostPackageImportPanel.tsx`
- Modify: `src/scripts/seed-blog.ts`
- Modify: `tests/helpers/createPostPackage.ts`
- Modify: `tests/helpers/createMDshipWorkspace.ts`
- Modify: `tests/e2e/frontend.e2e.spec.ts`

- [ ] **Step 1: Write the failing integration coverage**

Add or update tests so imports, seeded posts, and frontend references all read bibliography from the embedded post field instead of a related document.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts tests/int/seed-blog-content.int.spec.ts`

Expected: FAIL because package import and seeded content still create or expect `bibliography-files`.

- [ ] **Step 3: Implement the runtime and import cutover**

Write bibliography directly to `post.bibliography`, update seed content and fixtures, and keep frontend reference rendering behavior unchanged apart from the new source location.

- [ ] **Step 4: Re-run the focused tests**

Run: `PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts tests/int/api.int.spec.ts tests/int/seed-blog-content.int.spec.ts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 5: Regenerate generated artifacts and run full verification

**Files:**
- Modify: generated Payload type files and admin import map outputs as needed

- [ ] **Step 1: Regenerate Payload artifacts**

Run: `PAYLOAD_SECRET=test-secret pnpm generate:types`

Expected: PASS with updated embedded bibliography types.

- [ ] **Step 2: Regenerate the admin import map**

Run: `PAYLOAD_SECRET=test-secret pnpm generate:importmap`

Expected: PASS with the new bibliography field component registered.

- [ ] **Step 3: Run TypeScript verification**

Run: `PAYLOAD_SECRET=test-secret pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 4: Run the full integration suite**

Run: `PAYLOAD_SECRET=test-secret pnpm run test:int`

Expected: PASS
