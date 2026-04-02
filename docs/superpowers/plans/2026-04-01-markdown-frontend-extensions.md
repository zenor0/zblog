# Markdown Frontend Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add figure and table cross-references, table captions, and fenced `tsx` code block support to the frontend Markdown renderer without introducing MDX execution.

**Architecture:** Keep the existing `react-markdown` pipeline and extend it with a focused AST annotation pass plus richer React renderers for figure paragraphs, tables, and code blocks. Store article-element metadata on markdown nodes so cross-reference resolution and final UI stay in one pipeline.

**Tech Stack:** React, react-markdown, remark-gfm, remark-directive, mdast traversal, Vitest, TypeScript

---

### Task 1: Lock the new behavior with integration tests

**Files:**
- Create: `tests/int/markdown-renderer.int.spec.ts`

- [ ] **Step 1: Write the failing test**

Add renderer integration tests that cover labeled figures, captioned tables, unresolved article references, and fenced `tsx` code blocks.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-renderer.int.spec.ts`

Expected: FAIL because the renderer does not yet emit figure/table cross-reference markup.

- [ ] **Step 3: Write minimal implementation**

Update the markdown renderer pipeline to annotate article elements and render their metadata.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-renderer.int.spec.ts`

Expected: PASS

### Task 2: Extend the markdown pipeline and renderers

**Files:**
- Modify: `src/lib/citations.ts`
- Modify: `src/lib/markdown.tsx`
- Modify: `src/app/(frontend)/styles.css`

- [ ] **Step 1: Implement article reference parsing**

Add helpers that distinguish bibliography citations from article cross-references.

- [ ] **Step 2: Implement AST annotation**

Detect labeled figure paragraphs and table captions, assign numbering, and store metadata on nodes.

- [ ] **Step 3: Implement renderer updates**

Render figure wrappers, table captions, unresolved cross-references, and fenced code block labels.

- [ ] **Step 4: Run focused renderer tests**

Run: `pnpm vitest run --config ./vitest.config.mts tests/int/markdown-renderer.int.spec.ts tests/int/content-utils.int.spec.ts`

Expected: PASS

### Task 3: Verify the integrated change

**Files:**
- Modify: `tests/int/content-utils.int.spec.ts`

- [ ] **Step 1: Adjust or extend utility coverage if needed**

Keep citation utility expectations aligned with the new parser behavior while preserving bibliography semantics.

- [ ] **Step 2: Run TypeScript verification**

Run: `pnpm exec tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Run the full integration test suite**

Run: `pnpm run test:int`

Expected: PASS
