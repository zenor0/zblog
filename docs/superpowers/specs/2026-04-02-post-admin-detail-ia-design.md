# Post Admin Detail Information Architecture Design

**Date:** 2026-04-02

**Goal:** Reduce cognitive load in the Payload post detail screen by collapsing the current top-level tab set into an overview-first workflow: one status-focused `Overview` tab and one continuous `Edit` tab.

## Scope

- Reorganize the post document admin screen defined in [`src/collections/Posts.ts`](/home/zenor0/projects/zblog/src/collections/Posts.ts).
- Replace the current top-level `Content / References / Translations / SEO / Insights` arrangement with `Overview / Edit`.
- Convert the `Edit` experience from multiple peer tabs into a single scrollable editing surface grouped by editorial task flow.
- Expand the current insights presentation in [`src/components/payload/PostInsights.tsx`](/home/zenor0/projects/zblog/src/components/payload/PostInsights.tsx) into an overview dashboard for status, locale coverage, and asset health.
- Keep the live preview experience in [`src/components/payload/PostLivePreviewView.tsx`](/home/zenor0/projects/zblog/src/components/payload/PostLivePreviewView.tsx) available as a separate preview entry rather than a primary information-architecture section.

## Non-Goals

- No changes to the post data model shape.
- No changes to collection access control, hooks, endpoints, or citation validation behavior.
- No redesign of the live preview UI itself.
- No frontend article or public-site changes.
- No custom replacement of the entire Payload edit view if the desired structure can be achieved through native field layout primitives.

## Current State Summary

The post detail screen currently uses a top-level `tabs` field with five peer sections:

- `Content`
- `References`
- `Translations`
- `SEO`
- `Insights`

This creates two problems:

1. Low-frequency metadata such as translation metadata and SEO is given the same navigational weight as core article editing.
2. Editors must jump between tabs to complete what is functionally one editing workflow for a single post.

The current `Insights` tab is already directionally useful because it answers state questions quickly, but it competes with editing tabs instead of acting as the entry summary for the document.

## Chosen Approach

Use a two-level structure:

1. A top-level `Overview` tab for read-only document status and editorial health.
2. A top-level `Edit` tab for all mutable post fields, grouped into sections on a single page.

This keeps the highest-level navigation focused on the two real jobs an editor has on the screen:

- assess the current state
- edit the document

The implementation should prefer native Payload field organization:

- keep one top-level `tabs` field
- use `ui` for the overview dashboard
- use `collapsible`, `row`, and existing fields inside the `Edit` tab

This avoids introducing a fully custom edit view for a problem that is primarily information architecture, not product behavior.

## Information Architecture

### Top-Level Navigation

The post detail screen should expose exactly two primary tabs:

- `Overview`
- `Edit`

`Live Preview` remains a separate preview mode or entry point and is not counted as a primary content-management tab.

### Overview Tab

The `Overview` tab should act as a decision dashboard. It is read-only and optimized for fast scanning.

#### Section 1: Publishing Snapshot

Place a compact summary strip or card grid at the top with the highest-value document signals:

- publish status
- current locale content completeness
- translation status
- SEO completeness
- slug value or slug readiness
- last updated timestamp

This section should answer the question: "Can I understand the current health of this locale in a few seconds?"

Snapshot heuristics should be explicit:

- content completeness reuses the current locale-coverage rule already present in the insights component:
  - `complete` when both `title` and `content` are present
  - `partial` when only one is present
  - `missing` when neither is present
- SEO readiness should reflect effective frontend behavior rather than only explicit overrides:
  - title signal comes from `seo.metaTitle` or falls back to `title`
  - description signal comes from `seo.metaDescription`, then `excerpt`, then the existing body-derived summary behavior
  - social image signal comes from `seo.metaImage` or falls back to `heroImage`
- `noindex` should be surfaced as its own cautionary signal rather than being treated as missing SEO data

#### Section 2: Locale Coverage

Retain the strongest part of the current insights experience:

- per-locale title and content coverage
- translation status
- source locale
- translation timestamp
- default locale badge
- active locale badge

This remains the most important cross-locale diagnostic surface and should stay prominent.

#### Section 3: Content Assets

Group the active-locale supporting material into one summary section:

- hero image preview
- bibliography link summary
- attachment count
- tag count

This section tells the editor whether the article has the expected supporting materials.

#### Section 4: Owned Resources Summary

Keep reverse-linked resource counts, but lower their visual priority:

- owned bibliography file count
- owned media count
- total owned resource count

This is useful, but not as central as publishing readiness or locale coverage.

#### Exclusions From Overview

The overview should not render full join tables as a primary experience. The current join fields are useful for resource management, but they create too much weight for a summary screen.

`Overview` should therefore show counts and short summaries, not full list views.

### Edit Tab

The `Edit` tab should become a continuous editing page ordered by normal editorial workflow instead of technical field category.

#### Section 1: Core Content

Always expanded. Contains:

- `title`
- `excerpt`
- `content`

This is the main editing task and should be the first visible section.

#### Section 2: Assets & References

Contains:

- `heroImage`
- `bibliographyFile`
- `attachments`

`heroImage` should move out of the sidebar and into this section because it behaves like article content support, not global document metadata.

This grouping reflects the common editing sequence after drafting content: add a lead image, attach bibliography support, and manage downloadable assets.

#### Section 3: Translation

Split translation controls by importance:

- always-visible editable field:
  - `translationStatus`
- lower-priority read-only metadata in a collapsible subsection:
  - `translatedFromLocale`
  - `translatedAt`
  - `translationProvider`

Translation remains accessible without occupying its own top-level tab.

#### Section 4: SEO

Place SEO in its own collapsible section, collapsed by default:

- `seo.metaTitle`
- `seo.metaDescription`
- `seo.metaImage`
- `seo.noindex`

SEO remains available and structured, but no longer competes for first-tier attention with the article itself.

#### Section 5: Managed Resources

Place the existing read-only join fields at the bottom of the `Edit` page inside a low-priority collapsible section:

- `ownedBibliographyFiles`
- `ownedMedia`

This preserves access to the underlying resource lists without making them part of the overview dashboard or top-level navigation.

### Sidebar

The sidebar should become a light metadata rail rather than a mixed editing surface.

Keep:

- `slug`
- `tags`
- `publishedAt`

Remove:

- `heroImage`

The remaining sidebar fields are all cross-cutting metadata that are useful to glance at regardless of which main section the editor is working in.

## Data and Behavior Boundaries

This redesign should be layout-first and low-risk.

### Data shape

- Moving fields between tabs, sidebar, and `collapsible` sections must not change stored document shape.
- Existing nested structure for `seo` remains intact.
- No new post fields are introduced.

### Validation and hooks

- Citation validation in the post `beforeChange` hook remains unchanged.
- Publish timestamp behavior remains unchanged.
- Resource cleanup hooks remain unchanged.

### Access control and Local API usage

- Any updates to the overview component must preserve secure Local API access patterns.
- When a user is passed to the Local API, `overrideAccess: false` must continue to be applied.
- No nested operations are introduced in hooks as part of this redesign.

### New-document behavior

- `Overview` must retain a graceful empty state for unsaved posts.
- If the document has no ID yet, the overview should guide the user to save first before expecting coverage or resource summaries.

## Component and File Strategy

### Primary files

- [`src/collections/Posts.ts`](/home/zenor0/projects/zblog/src/collections/Posts.ts)
  - reorganize the field structure and top-level tabs
- [`src/components/payload/PostInsights.tsx`](/home/zenor0/projects/zblog/src/components/payload/PostInsights.tsx)
  - expand the component from an insights panel into a fuller overview dashboard

### Preferred implementation strategy

1. Keep the existing top-level `tabs` field, but reduce it to `Overview` and `Edit`.
2. Keep using a `ui` field for the overview surface rather than building a separate custom document view.
3. Use native `collapsible` sections for low-frequency edit areas so the data shape remains unchanged.
4. Preserve the existing live preview registration.

Renaming the `PostInsights` component is optional. The preferred path is to improve the existing component in place unless a rename materially improves maintainability with minimal diff cost.

## Error Handling and Edge Cases

- Unsaved posts must show a useful overview empty state.
- The overview must still work when:
  - there is no hero image
  - there is no bibliography file
  - there are zero attachments
  - there are zero tags
  - locale snapshots are partial or missing
- The edit layout must still be usable on smaller screens when long content and large arrays are present.
- Collapsed sections must not hide required-field validation in a confusing way; validation summaries should still remain discoverable through Payload's standard behavior.

## Testing and Verification

- Confirm the post detail screen exposes only two top-level tabs: `Overview` and `Edit`.
- Confirm the `Edit` tab no longer contains the current first-level tab split.
- Confirm all original mutable fields remain editable and save to the same data structure.
- Confirm `heroImage` editing still works after moving it into the main edit flow.
- Confirm the overview dashboard still renders correctly for saved and unsaved documents.
- Confirm locale switching continues to update overview diagnostics correctly.
- Run `pnpm run generate:types` after schema changes.
- Run `pnpm run generate:importmap` after modifying admin components.
- Run `pnpm exec tsc --noEmit`.

## Acceptance Criteria

1. Editors can understand a post's overall health from a single `Overview` tab without visiting multiple sections.
2. Editors can complete the main document editing workflow inside one continuous `Edit` page without navigating between multiple peer tabs.
3. Core content receives the strongest visual priority, while translation metadata, SEO, and managed resources are still available at lower emphasis.
4. The redesign preserves all current post behaviors, validation rules, and access-control expectations.
5. The resulting admin screen feels simpler because the hierarchy reflects editor workflow rather than implementation categories.

## Implementation Notes

Preferred implementation order:

1. Reorganize [`src/collections/Posts.ts`](/home/zenor0/projects/zblog/src/collections/Posts.ts) into the new `Overview / Edit` structure.
2. Move `heroImage` into the main edit layout and reduce the sidebar.
3. Expand [`src/components/payload/PostInsights.tsx`](/home/zenor0/projects/zblog/src/components/payload/PostInsights.tsx) to add publishing snapshot and content-asset summaries.
4. Reposition join fields into a low-priority managed-resources section.
5. Regenerate import map and types, then verify TypeScript correctness.
