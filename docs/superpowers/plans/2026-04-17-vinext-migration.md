# Vinext Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate this project to `vinext` inside an isolated branch/worktree while keeping `main` on the current Next.js workflow.

**Architecture:** Create a dedicated worktree, run `vinext` compatibility checks there, then switch branch-local package scripts and config from `next` to `vinext`. Keep application code changes as small as possible and verify the migrated branch with build and type checks before reporting results.

**Tech Stack:** Payload CMS 3, Next.js App Router, vinext, Vite, pnpm, TypeScript, SQLite

---

### Task 1: Create isolated workspace

**Files:**
- Modify: `.worktrees/<branch-name>/` via `git worktree`

- [ ] **Step 1: Create the migration branch in a worktree**

Run: `git worktree add .worktrees/vinext-migration -b vinext-migration`
Expected: Git creates a new worktree rooted at `.worktrees/vinext-migration` on branch `vinext-migration`

- [ ] **Step 2: Verify the worktree starts from the current project state**

Run: `git -C .worktrees/vinext-migration status --short --branch`
Expected: Output starts with `## vinext-migration`

### Task 2: Run vinext compatibility checks

**Files:**
- Modify: `package.json` if `vinext init` succeeds
- Review: `next.config.mjs`, `src/middleware.ts`, `src/app/**`

- [ ] **Step 1: Run the compatibility checker**

Run: `pnpm dlx vinext check`
Expected: A compatibility report for the existing App Router project

- [ ] **Step 2: Record blockers before editing**

Run: `pnpm dlx vinext check > /tmp/vinext-check.txt`
Expected: Report saved for review if the terminal output is noisy

### Task 3: Switch the branch to vinext

**Files:**
- Modify: `package.json`
- Create or modify: `vite.config.ts`
- Modify as needed: `next.config.mjs`, `postcss.config.*`, `tailwind.config.*`

- [ ] **Step 1: Attempt automated initialization**

Run: `pnpm dlx vinext init`
Expected: vinext installs dependencies, adds scripts, and creates a Vite config without deleting existing app code

- [ ] **Step 2: Review generated changes and patch project-specific gaps**

Run: `git diff -- package.json vite.config.ts next.config.mjs`
Expected: Diff shows the package swap and Vite config changes needed for this project

- [ ] **Step 3: Manually patch any remaining config mismatches**

Run: `pnpm install`
Expected: Lockfile and dependencies are consistent after any manual edits

### Task 4: Verify the migrated branch

**Files:**
- Review: `package.json`, `vite.config.ts`, generated lockfile updates

- [ ] **Step 1: Type-check the migrated branch**

Run: `pnpm exec tsc --noEmit`
Expected: TypeScript completes with no errors

- [ ] **Step 2: Build the migrated branch**

Run: `pnpm build`
Expected: vinext build completes successfully

- [ ] **Step 3: Smoke test the dev server if build passes**

Run: `pnpm dev`
Expected: Development server starts and reports a local URL without immediate runtime errors
