# Locale Policy

This project treats locale as a content-variant identifier, not as a generic browser string and not as a raw region code.

## Current policy

- Standard: use BCP 47 language tags as the canonical internal locale identifier.
- Internal canonical tags: `zh-Hans`, `en`
- Public URL slugs: `zh-hans`, `en`
- Default locale: `zh-Hans`
- Locale comparison: case-insensitive on input, canonicalized before use
- Project support model: allowlist only. We support only the locales declared in [`src/lib/locales.ts`](/home/zenor0/projects/zblog/src/lib/locales.ts).

## Why this exists

The project needs one locale model that works across:

- Payload localization config
- frontend routing
- preview URLs
- import/export packages
- translation metadata
- browser `Accept-Language` negotiation

Using a single canonical locale definition avoids the old `zh-CN` vs `zh-cn` vs `zh-Hans` drift and keeps URLs stable.

## Canonical tags vs public slugs

We intentionally separate internal locale tags from URL slugs.

- Internal canonical tag:
  Used in Payload localization, API parameters, stored translation metadata, and application logic.
- Public URL slug:
  Used in frontend routes and external links.

Examples:

- canonical `zh-Hans` -> public slug `zh-hans`
- canonical `en` -> public slug `en`

This gives us:

- standards-compliant internal locale identifiers
- lowercase, predictable URLs
- compatibility with legacy tags without leaking them into new links

## Locale selection rules

Choose the shortest BCP 47 tag that is precise enough to distinguish actual content variants.

Use:

- language only when the content does not vary further
  Example: `en`
- language + script when script is the meaningful distinction
  Example: `zh-Hans`, `zh-Hant`
- language + region only when the content is region-specific
  Example: `en-US`, `en-GB`, `pt-BR`

Do not add a region just to make the tag look more complete.

## Chinese policy

In this project, Chinese currently means simplified Chinese content, not a Mainland China regional variant.

That is why we use:

- `zh-Hans`

and not:

- `zh-CN`

If we later add traditional Chinese, the expected canonical tag is:

- `zh-Hant`

If we ever need region-specific Chinese content, we can introduce a more specific tag at that time, such as `zh-Hans-SG` or `zh-Hant-TW`, but only if the content actually diverges.

## Input normalization

Incoming locale values may arrive from:

- route params
- query params
- admin UI
- imported frontmatter
- legacy links
- browser headers

The app normalizes these values before matching them against the supported allowlist.

Accepted legacy examples that currently normalize to `zh-Hans`:

- `zh-CN`
- `zh-cn`
- `zh-Hans-CN`
- `zh-hans-cn`

Examples:

- `EN` -> `en`
- `en-us` does not become a supported locale by itself; it matches to `en` only through locale matching or alias handling
- `fr-CA` is not supported unless we explicitly add it

Implementation lives in [`src/lib/locales.ts`](/home/zenor0/projects/zblog/src/lib/locales.ts).

## Browser language negotiation

The root route `/` uses `Accept-Language` negotiation and redirects to the best supported locale.

Current behavior:

- `/` + browser preference `en-US,en;q=0.9,zh;q=0.8` -> `/en`
- `/` + browser preference `zh-CN,zh;q=0.9,en;q=0.8` -> `/zh-hans`

Implementation:

- parsing and canonicalization: built from the platform `Intl` APIs
- locale matching: [`@formatjs/intl-localematcher`](https://formatjs.github.io/docs/polyfills/intl-localematcher/)
- redirect middleware: [`src/middleware.ts`](/home/zenor0/projects/zblog/src/middleware.ts)

Priority order for locale resolution is:

1. explicit locale in the URL
2. stored locale preference cookie
3. browser `Accept-Language`
4. project default locale

The browser header is only a negotiation input. It does not expand the set of supported content locales.

## SEO and canonical URLs

- Public locale URLs remain canonical and stable: `/en`, `/zh-hans`
- Incoming legacy or non-canonical locale-like paths such as `/zh-cn` or `/en-us` redirect to the canonical slug when they map cleanly
- Localized pages emit canonical and `hreflang` metadata for the supported variants
- Fallback pages that render another locale's content are marked `noindex` and canonicalize to the actual source locale URL
- The frontend also emits `Content-Language`, `robots.txt`, and `sitemap.xml`

## Runtime and storage rules

- Payload localization uses canonical tags only.
- Frontend URLs use slugs only.
- New generated links must always use helpers such as `buildLocalePath`.
- Stored translation metadata such as `translatedFromLocale` must use canonical tags.
- Imported markdown frontmatter may use legacy tags, but it will be normalized on import.

Relevant files:

- [`src/lib/locales.ts`](/home/zenor0/projects/zblog/src/lib/locales.ts)
- [`src/lib/preview.ts`](/home/zenor0/projects/zblog/src/lib/preview.ts)
- [`src/payload.config.ts`](/home/zenor0/projects/zblog/src/payload.config.ts)
- [`src/middleware.ts`](/home/zenor0/projects/zblog/src/middleware.ts)
- [`src/lib/post-package-import.ts`](/home/zenor0/projects/zblog/src/lib/post-package-import.ts)

## Adding a new locale

When adding a locale, do all of the following:

1. Decide the canonical BCP 47 tag.
2. Decide the lowercase public slug.
3. Add the locale definition and any legacy aliases in [`src/lib/locales.ts`](/home/zenor0/projects/zblog/src/lib/locales.ts).
4. Add frontend copy for the new locale in [`src/app/(frontend)/helpers.ts`](/home/zenor0/projects/zblog/src/app/(frontend)/helpers.ts).
5. Confirm date formatting and reading-time behavior still make sense for that locale.
6. Update seed data or import fixtures if they depend on the locale list.
7. Run `pnpm run generate:types`.
8. Run `pnpm exec tsc --noEmit`.
9. Run `pnpm run test:int`.
10. Run `pnpm run test:e2e` if routes or UI changed.

## Renaming an existing locale

Locale renames are a data migration, not just a constant change.

If a canonical locale changes:

1. Update [`src/lib/locales.ts`](/home/zenor0/projects/zblog/src/lib/locales.ts).
2. Update Payload localization config in [`src/payload.config.ts`](/home/zenor0/projects/zblog/src/payload.config.ts).
3. Add aliases for old input values when backward compatibility is needed.
4. Migrate stored `_locale` values and translation metadata in the database.
5. Regenerate types.
6. Run tests.

The current migration helper is:

- `pnpm run migrate:locales`

Implementation:

- [`src/scripts/migrate-locales.ts`](/home/zenor0/projects/zblog/src/scripts/migrate-locales.ts)

## What not to do

- Do not compare locale strings directly in ad hoc code.
- Do not build locale URLs with string interpolation like `/${locale}/...`.
- Do not assume locale input casing is already correct.
- Do not use a region tag unless the content is truly region-specific.
- Do not try to support arbitrary runtime locales outside the allowlist.

## Practical examples

Good:

- `en`
- `zh-Hans`
- `zh-Hant`
- `pt-BR`

Usually unnecessary:

- `en-US` if the project only has one English content set
- `zh-CN` if the project really means simplified Chinese rather than a China-specific variant

## Decision log

- March 14, 2026:
  canonical Chinese locale changed from `zh-CN` to `zh-Hans`
- March 14, 2026:
  public locale URLs standardized to lowercase slugs
- March 14, 2026:
  root route started negotiating locale via `Accept-Language`
