# Footer

## Purpose

The footer is Payload-backed, localized, and structured for a mature content site without adding enterprise-only modules. It should render valid configured sections consistently while remaining visually aligned with the editorial frontend.

The schema is defined in `SiteSettings.footer`; normalization lives in `src/features/site-settings/model/site-footer.ts`; rendering lives in `src/features/site-settings/ui/SiteFooter.tsx`.

The admin preview uses `/preview/site-footer` in an iframe so it runs inside the real frontend shell. The Payload field sends the current unsaved form values to that iframe with a same-origin `postMessage`, and the iframe renders the same normalized `SiteFooterLayout` used by production pages.

## Schema

The footer group contains:

- `layoutStyle`
- `brand`
- `navigationSections`
- `socialLinks`
- `contactItems`
- `legalLinks`
- `compliance`
- `bottomBar`

Human-facing copy is localized where practical. Logo media, external URLs, social URLs, and internal path definitions are shared across locales.
The site name and owner display name are localized in General settings so footer references such as `{{site.name}}` and `{{owner.name}}` resolve to the active locale.

## Link Model

Managed footer links use a shared shape:

- `type`: `internal` or `external`
- `internalPath`: locale-agnostic site path such as `/posts`
- `externalUrl`: absolute external URL
- `openInNewTab`: optional new-tab behavior

Internal paths are resolved with `buildLocalePath(locale, internalPath)`. Content editors should not enter locale-prefixed paths.

External links may include `target="_blank"` and `rel="noreferrer"` when configured to open in a new tab.

Social links are always outbound and use their own `url` plus `openInNewTab` fields.

## Normalization

`normalizeSiteFooter` converts raw `SiteSettings` into a render-ready model.

It is responsible for:

- resolving footer links
- filtering invalid navigation, contact, social, legal, and compliance items
- falling back from empty brand name to `settings.siteName`
- preserving brand logo and brand link when valid
- resolving `layoutStyle`
- returning `null` when no usable footer content exists

The render component should receive normalized data and stay mostly presentational.

## Layout Styles

Available layout styles:

- `compact`: default. A single compact record for links, copyright, and compliance numbers.
- `directory`: grouped navigation and utility sections with compliance metadata below.
- `ledger`: legal-first layout that keeps filings, copyright, and required links prominent.
- `balanced`: a three-layer directory with navigation, profile links, and compliance metadata.

The footer layout lab under `/dev/footer-layouts` exists to compare these styles with realistic content.

## Starter Preset

Footer controls include **Apply starter footer**. It replaces the current footer with a generic blog footer and fills in missing shared variables without overwriting existing editor data.

The preset uses editable references:

- `{{site.name}}`
- `{{site.description}}`
- `{{site.currentYear}}`
- `{{custom.tagline}}`

After applying it, editors usually only need to change the site name, site description, and tagline in General settings. Social and contact links are intentionally left for editors to add explicitly.

The blog seed applies starter footer data per locale without using Payload fallback reads, so `zh-Hans` and `en` both receive their own footer copy instead of inheriting the default locale.

## Rendering Rules

- Render nothing if normalization returns `null`.
- Render brand text cleanly when no logo exists.
- Render brand content without a link wrapper when the brand link is invalid.
- Drop navigation sections without a title or valid links.
- Drop social links without URLs.
- Drop contact items without both label and value.
- Drop legal links without valid destinations.
- Drop compliance filings without both label and value.
- Render bottom note independently from other compliance content.

## Visual Rules

The footer should use:

- editorial typography
- simple borders
- compact metadata styling
- restrained spacing
- predictable link treatment

Avoid treating the footer as a decorative card grid. It is low-frequency site infrastructure and should not compete with article content.

## Verification

Use integration tests for:

- link resolution for internal and external destinations
- fallback to site name
- filtering invalid sections
- rendering each layout style
- rendering legal, compliance, contact, social, and navigation content
- returning `null` for empty normalized footer content

Schema changes require `pnpm run generate:types`; admin component path changes require `pnpm run generate:importmap`.
