# Payload Post Editor

## Purpose

The post editor is organized around editorial work rather than the underlying Payload field layout. Editors should be able to assess a post first, then move through writing, supporting assets, translation, and SEO without hunting through low-value peer tabs.

The source of truth is the `posts` collection in `src/collections/Posts.ts`.

## Top-Level IA

The post edit screen uses one top-level Payload `tabs` field with these tabs, in order:

1. `Overview`
2. `Core Content`
3. `Assets & References`
4. `Translation`
5. `SEO`

The sidebar is reserved for cross-cutting metadata:

- `slug`
- `tags`
- `publishedAt`

Live preview remains registered as an admin preview view, not as a content-management tab.

## Overview

`Overview` is a read-only dashboard rendered by `PostInsights`. It is the default first screen for checking document health.

It should summarize:

- publishing state and last-update status
- locale coverage for title, excerpt, and content
- translation status and source metadata
- SEO readiness, including fallback behavior from title, excerpt, body, hero image, and social image
- hero image, attachments, tags, bibliography state, and owned media counts

Unsaved posts must render a useful empty state instead of failing or implying that resource summaries are available.

## Core Content

`Core Content` contains the primary writing surface:

- localized `title`
- localized `excerpt`
- localized Markdown `content`
- `ownedMedia` join as a secondary resource reference

The content field documents the supported Markdown syntax at the point of authoring, including GitHub-style callouts and bibliography citations.

## Assets and References

`Assets & References` groups article support material:

- `heroImage`
- embedded `bibliography`
- `attachments`

`heroImage` and attachment media use the shared-or-current-post ownership filter so editors can select shared media or media owned by the current post.

The bibliography is a post-owned group, not a relationship to a reusable resource. See [Bibliography](../content/bibliography.md).

## Translation

`Translation` is a locale management surface, not a regular field editing tab.

The visible UI is `PostTranslationManager`. It should present all supported locales with:

- completion status for localized article fields
- translation status
- source locale
- translation timestamp
- default and active locale markers
- actions to switch locale or translate from an explicit source locale

The localized storage fields remain hidden or read-only in normal editing:

- `translationStatus`
- `translatedFromLocale`
- `translatedAt`
- `translationProvider`

Translation actions call the existing post auto-translate endpoint with explicit `sourceLocale` and `targetLocale`. The action must not depend on the currently selected admin locale as the implicit target.

## SEO

`SEO` keeps localized search and sharing overrides separate from authoring:

- `seo.metaTitle`
- `seo.metaDescription`
- `seo.metaImage`
- `seo.noindex`

Fallback behavior matters for both UI and frontend rendering:

- title falls back to the post title
- description falls back to excerpt, then body-derived summary
- social image falls back to hero image, then site default image
- `noindex` is a cautionary publishing signal, not missing SEO data

## Safety Rules

- Moving fields between tabs must not change the stored document shape.
- Post access control stays restrictive through `editorOnly`, `publishedOrEditor`, and `publishedVersionsOrEditor`.
- Local API calls that pass a user must keep `overrideAccess: false`.
- Nested Payload operations inside hooks must pass `req`.
- Citation validation, publish timestamp behavior, ownership cleanup, drafts, versions, preview URLs, and live preview must remain compatible with the existing collection behavior.

## Verification

Use focused tests when changing this area:

- post admin config exposes the intended tabs in order
- overview renders for saved and unsaved posts
- translation manager computes locale completion and submits explicit source/target locales
- bibliography field remains accessible from `Assets & References`
- Payload types and import map are regenerated after schema or admin component path changes
- `pnpm exec tsc --noEmit`
