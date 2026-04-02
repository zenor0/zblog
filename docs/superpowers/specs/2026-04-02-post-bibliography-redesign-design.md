# Post Bibliography Redesign

**Date:** 2026-04-02

**Goal:** Replace the current reusable `bibliography-files` resource model with a strict one-post-one-bibliography model where each post owns a single non-localized bibliography source stored as embedded `BibTeX` text, while the admin editor provides both structured editing and raw `BibTeX` fallback.

## Scope

- Remove the standalone `bibliography-files` collection from the content model.
- Replace the `Posts.bibliographyFile` relationship with an embedded non-localized `bibliography` group on the post document.
- Keep `BibTeX` source as the only persisted bibliography truth.
- Add an admin editing experience that supports:
  - file upload into the current post
  - raw `BibTeX` editing
  - structured bibliography editing for common entry types and fields
- Update frontend and server-side bibliography loading to read from the post document directly.
- Update package import, insights, seed data, and tests to use the new model.

## Non-Goals

- No backward-compatibility layer for existing bibliography documents.
- No migration script.
- No support for sharing one bibliography across multiple posts.
- No localized bibliography content.
- No permanent structured JSON persistence alongside the `BibTeX` source.
- No attempt to guarantee structured editing for every possible `BibTeX` construct.

## Product Decisions

### Ownership model

- Bibliography belongs to the post, not to a reusable asset library.
- Each post has at most one bibliography.
- Bibliography is not localized. All locales of a post share the same bibliography source.

### Persistence model

- The only persisted bibliography body is `post.bibliography.source`.
- `post.bibliography.filename` stores the original uploaded filename when available.
- Structured editing is an admin view over the source text, not a second persisted data model.

### Compatibility stance

- This is a hard cut to the new model.
- Old collection-level bibliography references are removed rather than supported in parallel.
- Existing code should be rewritten to the new model instead of wrapped in compatibility branches.

## Data Model

Update [`src/collections/Posts.ts`](/home/zenor0/projects/zblog/src/collections/Posts.ts) so the References tab contains a `bibliography` group instead of a `bibliographyFile` relationship.

Recommended shape:

- `bibliography`
  - `filename`: `text`
  - `source`: `code`

Field behavior:

- `bibliography.filename`
  - optional
  - non-localized
  - metadata only
- `bibliography.source`
  - optional when the post body contains no citations
  - non-localized
  - the only canonical bibliography source
  - should use plaintext or `bibtex`-style editor configuration if available

The `attachments` array remains in the References tab and continues to use media relationships.

Delete [`src/collections/BibliographyFiles.ts`](/home/zenor0/projects/zblog/src/collections/BibliographyFiles.ts) and remove it from [`src/payload.config.ts`](/home/zenor0/projects/zblog/src/payload.config.ts).

## Admin Editing Experience

### Core editor

Create a custom admin component for the bibliography field group. The component should be mounted from the post edit view and operate only on the current post document.

The editor exposes two modes:

- `Structured`
- `Raw BibTeX`

Both modes read from and write to `bibliography.source`.

### Raw mode

Raw mode provides:

- direct text editing of `bibliography.source`
- `.bib` file upload that loads the file content into `bibliography.source`
- filename capture into `bibliography.filename`
- parse error feedback when the source is invalid

This mode is always available and acts as the fallback path for advanced or irregular `BibTeX`.

### Structured mode

Structured mode parses `bibliography.source` into editable entry cards or rows.

Supported capabilities:

- list entries
- add entry
- delete entry
- edit citation key
- edit common entry types
- edit common fields such as:
  - title
  - author
  - editor
  - translator
  - year
  - journal
  - booktitle
  - publisher
  - institution
  - volume
  - number
  - pages
  - doi
  - url
  - note

Save behavior:

- structured edits are converted back into `BibTeX`
- the generated `BibTeX` replaces `bibliography.source`

### Structured editing boundary

Structured mode is intentionally limited to safe, common cases.

If the source contains entries or field shapes that cannot be safely round-tripped without losing meaning:

- show a clear warning
- allow preview if useful
- disable writeable structured editing for that source
- direct the editor to `Raw BibTeX`

The system should prefer safety over forcing normalization.

## Parsing and Serialization

Extend bibliography utilities in [`src/lib/bibliography.ts`](/home/zenor0/projects/zblog/src/lib/bibliography.ts) so they support both:

- parsing existing `BibTeX` into display and editing data
- serializing supported structured data back into `BibTeX`

Recommended utility split:

- parse raw `BibTeX` source into normalized entries
- derive display-friendly metadata for frontend and admin preview
- derive structured editable entries for safe entry types
- serialize structured editable entries back to `BibTeX`
- surface parser and round-trip limitations explicitly

The parser must remain tolerant for rendering and diagnostics. The serializer can be narrower and only handle the structured shapes the editor itself produces.

## Validation and Save Rules

Keep citation validation on the post save path in [`src/collections/Posts.ts`](/home/zenor0/projects/zblog/src/collections/Posts.ts), but change its source lookup.

Rules:

- If post content contains no bibliography citation keys, bibliography source may be empty.
- If post content contains bibliography citation keys and bibliography source is empty, save fails.
- If bibliography source exists but cannot be parsed well enough to extract keys, save fails.
- If bibliography source parses successfully but does not include every cited key in the current locale content, save fails.

Validation still runs per locale content body, but the bibliography source itself is shared across locales.

Expected error classes:

- missing bibliography source
- invalid `BibTeX`
- missing cited keys

## Frontend and Server-Side Reading

Update post-loading flows in [`src/lib/posts.ts`](/home/zenor0/projects/zblog/src/lib/posts.ts) so bibliography resolution reads from the embedded bibliography group.

Behavior:

- read `post.bibliography.source`
- parse bibliography entries from that source
- compute referenced entries against the current locale body
- keep existing citation numbering and missing-key reporting behavior

Frontend article rendering in [`src/components/frontend/PostArticle.tsx`](/home/zenor0/projects/zblog/src/components/frontend/PostArticle.tsx) should continue to receive resolved bibliography entries and missing citation diagnostics exactly as before, but the source of truth becomes the embedded post field.

## Package Import

Update package import logic in [`src/lib/post-package-import.ts`](/home/zenor0/projects/zblog/src/lib/post-package-import.ts) and related admin UI in [`src/components/payload/PostPackageImportPanel.tsx`](/home/zenor0/projects/zblog/src/components/payload/PostPackageImportPanel.tsx).

New import behavior:

- when a package includes bibliography content, write it directly to `post.bibliography.source`
- store the incoming filename in `post.bibliography.filename`
- do not create or update any standalone bibliography resource
- when a package contains citations but no bibliography source, fail import

This keeps imported bibliography ownership aligned with the post model.

## Admin Insights and Related UI

Update [`src/components/payload/PostInsights.tsx`](/home/zenor0/projects/zblog/src/components/payload/PostInsights.tsx) to stop treating bibliography as a related resource.

Remove:

- bibliography resource counts
- linked bibliography document title display
- owned bibliography joins

Replace with post-level bibliography insights such as:

- bibliography present or absent
- parse success or failure
- number of parsed entries
- stored filename when present

The admin should describe bibliography as post metadata, not as a linked asset.

## Resource Ownership Cleanup

Delete bibliography-specific ownership and cleanup logic that only existed to manage imported bibliography documents.

This includes bibliography handling in:

- [`src/lib/post-owned-resources.ts`](/home/zenor0/projects/zblog/src/lib/post-owned-resources.ts)
- [`src/hooks/posts/captureOwnedResourcesBeforeDelete.ts`](/home/zenor0/projects/zblog/src/hooks/posts/captureOwnedResourcesBeforeDelete.ts)
- [`src/hooks/posts/deleteOwnedResourcesAfterDelete.ts`](/home/zenor0/projects/zblog/src/hooks/posts/deleteOwnedResourcesAfterDelete.ts)

Media ownership and cleanup remain.

## Seed Data and Test Fixtures

Update seed and fixture sources so they write embedded bibliography fields directly on posts.

Affected areas include:

- [`src/scripts/seed-blog.ts`](/home/zenor0/projects/zblog/src/scripts/seed-blog.ts)
- [`tests/helpers/createPostPackage.ts`](/home/zenor0/projects/zblog/tests/helpers/createPostPackage.ts)
- [`tests/helpers/createMDshipWorkspace.ts`](/home/zenor0/projects/zblog/tests/helpers/createMDshipWorkspace.ts)

Seed content should keep demonstrating citations and references, but without standalone bibliography resources.

## Testing and Verification

Required test coverage:

- post save fails when content contains citation keys and bibliography source is missing
- post save fails when bibliography source is invalid
- post save fails when cited keys are missing from the bibliography source
- post rendering still resolves references correctly from embedded bibliography source
- package import writes bibliography into the post document
- structured admin editing can round-trip supported entries back to `BibTeX`
- unsupported or unsafe bibliography shapes fall back to raw editing

Verification commands after implementation:

- `pnpm tsc --noEmit`
- `pnpm generate:types`
- `payload generate:importmap`
- relevant targeted tests for post validation, bibliography utilities, frontend rendering, and import flows

## Acceptance Criteria

1. Posts store bibliography directly as embedded non-localized data.
2. The admin post editor no longer asks the editor to select a reusable bibliography document.
3. Editors can either upload or paste raw `BibTeX` for the current post.
4. Editors can use structured editing for supported bibliography shapes without introducing a second persisted data model.
5. Raw `BibTeX` remains available as a safe fallback for unsupported or ambiguous cases.
6. Citation validation, reference rendering, and import behavior all operate on the embedded post bibliography.
7. The project contains no standalone bibliography collection or bibliography resource lifecycle code.

## Implementation Notes

Preferred path:

1. Replace the post schema and delete the standalone bibliography collection.
2. Refactor bibliography utilities to operate on embedded source and support safe structured serialization.
3. Replace admin bibliography editing with the two-mode embedded editor.
4. Rewrite post loading, import, insights, seeds, and tests to use the new model.
5. Regenerate types and import map, then verify with targeted tests and TypeScript checks.
