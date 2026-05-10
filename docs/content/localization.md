# Localization

## Canonical Locales

Supported application locales are defined in `src/lib/locales.ts`.

| Locale    | Public slug | Label    | Notes                                                                                     |
| --------- | ----------- | -------- | ----------------------------------------------------------------------------------------- |
| `zh-Hans` | `zh-hans`   | 简体中文 | Default locale. Accepts aliases such as `zh-CN`, `zh-cn`, `zh-Hans-CN`, and `zh-hans-cn`. |
| `en`      | `en`        | English  | Secondary locale.                                                                         |

The default locale is `zh-Hans`; the default public slug is `zh-hans`.

## URL Policy

Public routes use lowercase locale slugs:

- `/zh-hans`
- `/en`
- `/zh-hans/posts/my-post`
- `/en/posts/my-post`

Use `buildLocalePath(locale, pathname)` when constructing public links. Do not hard-code locale prefixes in content-managed internal paths.

`normalizeLocale` accepts canonical codes, public slugs, and registered aliases. Traditional Chinese regions and scripts are not mapped into `zh-Hans`.

## Request Negotiation

The frontend middleware handles locale routing:

- `/` redirects to the cookie locale or the best `Accept-Language` match.
- Non-canonical locale path segments redirect to the canonical slug.
- Canonical locale requests set the `x-zblog-locale` request header.
- The selected locale is persisted in the `zblog-locale` cookie for one year.
- `Content-Language` is set on localized responses.

Admin, API, static assets, robots, sitemap, and file-like paths bypass the locale middleware.

## Payload and Content Fields

Payload locales are derived from the same supported locale list.

Localized content includes:

- post `title`, `excerpt`, `content`
- post translation metadata fields
- post SEO fields
- site settings descriptions and homepage hero copy
- footer display copy

Non-localized content includes:

- post bibliography source
- post slug
- media relationships unless a field explicitly opts into localization
- footer external URLs and internal path definitions

## Fallback Behavior

Public post loading may fall back to the default locale when the requested locale is not renderable. SEO metadata should use the canonical locale that is actually rendered.

Locale switch links should be built with route helpers and available-locale checks, not by string-concatenating the current path.

## Adding a Locale

When adding or renaming a locale:

1. Update `supportedLocales` in `src/lib/locales.ts`.
2. Add or update message files under `src/i18n/messages/`.
3. Confirm Payload locale config includes the new locale.
4. Review localized fields in collections and globals.
5. Update route, sitemap, SEO alternate-locale behavior, and middleware expectations.
6. Add or adjust tests for locale normalization, routing, translated content, and SEO alternates.
