# Footer Rebuild Design

**Date:** 2026-04-17

**Goal:** Rebuild the Payload-backed site footer so the backend schema expresses a mature website footer directly and the frontend renders the full configuration consistently across locales.

## Summary

Replace the current minimal footer model in [`src/globals/SiteSettings.ts`](/home/zenor0/projects/zblog/src/globals/SiteSettings.ts) with a structured, localized footer schema that supports:

- a brand area with logo, localized copy, and optional brand link
- fully configurable navigation groups managed in Payload
- dedicated social links and contact items
- legal links and compliance records
- a secondary bottom bar note

The frontend footer in [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx) should be refactored to render those sections using the site's existing editorial visual language instead of treating the footer as a small collection of note and link fields.

## Goals

- Make the footer schema semantically explicit instead of relying on generic `records` and `links`.
- Support a mature "basic marketing/content site" footer without introducing enterprise-only complexity.
- Keep nearly all footer display copy localized.
- Support both internal localized routes and external URLs from footer-managed links.
- Preserve the public site's editorial frontend tone and spacing system.
- Make the frontend resilient to partially configured footer content by rendering only valid sections.

## Non-Goals

- No attempt to preserve the old footer data structure.
- No migration layer that reads both old and new footer shapes at runtime.
- No redesign of the homepage, header, or article layout outside of whatever shared footer styling naturally touches.
- No newsletter, product matrix, hiring, office address, or operating-hours modules in this iteration.
- No client-side footer interactions that require React state.

## Current State

- [`src/globals/SiteSettings.ts`](/home/zenor0/projects/zblog/src/globals/SiteSettings.ts) currently defines `footer.note`, `footer.owner`, `footer.copyright`, `footer.records`, and `footer.links`.
- [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx) renders those fields into:
  - a site name and note block
  - a small owner/copyright column
  - a simple records list
  - a flat link row
- The current structure cannot express grouped navigation, dedicated social/contact areas, or a clear legal/compliance layer.
- The current backend model and frontend output are both too limited for the requested "mature website footer" target.

## Product Decisions Confirmed

- Footer scope is the "basic mature" version, not the content-site-enhanced or enterprise-expanded version.
- Navigation groups must be fully configurable in Payload rather than hard-coded in the frontend.
- The brand area must support:
  - optional logo
  - localized brand copy
  - an optional brand link
- Social and contact content must be modeled as dedicated footer modules rather than hidden inside generic link groups.
- Footer links must support both internal site paths and external URLs.
- The rebuild ignores backward compatibility and replaces the footer data model completely.
- Nearly all footer display text should be localized.

## Proposed Schema

Replace the current `footer` group with the following conceptual structure:

```ts
footer: {
  brand: {
    logo: relationship<'media'> | null
    name: localized text | null
    description: localized textarea | null
    supportingText: localized textarea | null
    link: linkField | null
  }

  navigationSections: [
    {
      title: localized text
      links: [
        {
          label: localized text
          description: localized text | null
          link: linkField
        }
      ]
    }
  ]

  socialLinks: [
    {
      platform: 'github' | 'x' | 'linkedin' | 'youtube' | 'instagram' | 'discord' | 'rss' | 'email' | 'other'
      label: localized text | null
      url: text
      openInNewTab: boolean
    }
  ]

  contactItems: [
    {
      label: localized text
      value: localized text
      link: linkField | null
    }
  ]

  legalLinks: [
    {
      label: localized text
      link: linkField
    }
  ]

  compliance: {
    copyright: localized text | null
    filings: [
      {
        label: localized text
        value: localized text
        href: text | null
      }
    ]
  }

  bottomBar: {
    note: localized textarea | null
  }
}
```

### Shared link field

Use one reusable link shape anywhere footer content needs navigation:

```ts
type FooterLink = {
  type: 'internal' | 'external'
  internalPath?: string | null
  externalUrl?: string | null
  openInNewTab?: boolean | null
}
```

Design rules:

- `internalPath` stores locale-agnostic site paths such as `/posts` or `/about`.
- `externalUrl` stores absolute external URLs.
- Only one destination mode is valid at a time.
- `openInNewTab` is present on the shared field everywhere for consistency, but the frontend should treat it as primarily relevant to external URLs.

### Localization rules

- Localize all human-facing footer copy:
  - brand name
  - brand description
  - brand supporting text
  - navigation section titles
  - navigation link labels and descriptions
  - social labels when present
  - contact labels and values
  - legal labels
  - compliance labels and values
  - bottom note
- Do not localize logo media relationships.
- External URLs are shared across locales by default.
- Internal paths should stay locale-agnostic and be resolved at render time.

## Admin Modeling Notes

- Keep the footer as a single group under `site-settings`.
- Prefer nested groups and arrays over freeform block composition because the requested scope is known and stable.
- Use array labels that match editor expectations:
  - Navigation sections
  - Social links
  - Contact items
  - Legal links
  - Compliance filings
- Add concise admin descriptions where the routing behavior is non-obvious, especially for internal paths.
- Since the schema changes, regenerate:
  - Payload types
  - Payload import map if any component path changes are introduced as part of admin config updates

## Frontend Architecture

Keep [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx) as the public entry point but decompose its rendering into focused helpers or sibling components.

Recommended boundaries:

1. `SiteFooter`
   - receives `SiteSettings`
   - normalizes footer data
   - filters invalid/empty sections
   - resolves localized internal links
   - composes the final layout

2. `FooterBrand`
   - renders logo, brand name, description, supporting text, and optional brand link

3. `FooterNavSections`
   - renders navigation group columns
   - supports optional per-link descriptions

4. `FooterSocialLinks`
   - renders social links consistently and accessibly

5. `FooterContactItems`
   - renders contact labels and values
   - allows either plain text or linked values

6. `FooterBottomBar`
   - renders legal links, compliance items, copyright, and bottom note

Exact component filenames can vary; the design requirement is separation of concerns, not a specific file count.

## Rendering and Layout Design

### Desktop layout

Use a two-tier footer layout:

- top tier:
  - left: brand area
  - right: navigation groups, social links, and contact items
- bottom tier:
  - legal links
  - compliance filings
  - copyright
  - bottom note

### Mobile layout

Stack sections in this order:

1. brand
2. navigation groups
3. social links
4. contact items
5. legal/compliance/bottom note

### Visual language

- Preserve the current editorial frontend direction from [`src/app/(frontend)/styles.css`](/home/zenor0/projects/zblog/src/app/(frontend)/styles.css).
- Use spacing, typography hierarchy, borders, and restrained metadata styling rather than product-style cards or button treatments.
- Keep the footer visually integrated with the current homepage and article styling.

## Link Resolution Strategy

Introduce a small footer link resolver helper.

Behavior:

- `internal` links:
  - validate that `internalPath` exists and is non-empty
  - resolve with `buildLocalePath(locale, internalPath)`
- `external` links:
  - validate that `externalUrl` exists and is non-empty
  - use the URL as-is
- invalid links:
  - return `null`
  - filtered out before rendering

Rendering rules:

- External links should include secure rel handling when opening a new tab.
- Brand, navigation, contact, and legal areas should all share this resolution logic where applicable.
- Social links use a simpler `url + openInNewTab` model because they are always outbound in this design.

## Fallback and Empty-State Rules

- If `footer` is absent or every section is empty after normalization, render nothing.
- If `brand.name` is empty, fall back to `settings.siteName`.
- If the brand link is invalid, render the brand content without a link wrapper.
- If the brand logo is missing, render the text brand cleanly without leaving an empty media slot.
- Navigation sections without valid titles or valid links are dropped.
- Social links without a valid URL are dropped.
- Contact items without a label and a value are dropped.
- Legal links without a valid destination are dropped.
- Compliance filings without both label and value are dropped.
- Bottom note renders independently and does not depend on any other bottom-bar content.

## Testing Strategy

Follow test-first implementation. Add or update integration coverage in `tests/int`.

### Helper tests

- footer link resolution builds localized internal paths correctly
- footer link resolution keeps external URLs unchanged
- invalid link objects resolve to `null`
- new-tab behavior produces the expected target/rel output contract

### Footer rendering tests

- renders the brand block with fallback to `siteName`
- renders brand logo/link when configured
- renders multiple navigation sections with localized labels
- renders social links separately from navigation links
- renders contact items with linked and plain-text values
- renders legal links, compliance filings, and bottom note in the lower footer region
- omits empty or invalid sections cleanly
- returns `null` when the normalized footer has no usable content

### E2E coverage

No new e2e test is required for acceptance in this iteration. Targeted integration coverage in `tests/int` is the required minimum unless implementation work exposes a regression that cannot be covered meaningfully there.

## Risks and Mitigations

### Risk: Footer schema becomes verbose for editors

Mitigation:

- keep the information architecture fixed instead of block-driven
- add precise field labels and descriptions
- use reusable nested link groups so editors do not re-learn different link shapes per section

### Risk: Localized internal links are entered with locale prefixes

Mitigation:

- document in admin help text that internal paths should be locale-agnostic
- normalize or reject obvious prefixed values if that can be done safely during implementation

### Risk: Footer rendering logic becomes a large conditional component again

Mitigation:

- centralize normalization and link resolution
- split display sections into focused helpers/components
- keep each subcomponent data-driven and presentation-only

### Risk: Rebuilding the schema invalidates existing footer content

Mitigation:

- accept this intentionally as part of the agreed redesign
- ensure the frontend handles partially re-entered content gracefully during the transition period

## Implementation Notes

- Update the `SiteSettings` global schema first.
- Regenerate Payload types after the schema change.
- Regenerate Payload import maps if admin component path config changes.
- Refactor footer rendering only after the new types exist so the component can target the final shape directly.
- Keep Local API and Payload security rules unchanged; this work is a frontend/global-schema change and should not introduce any unsafe access patterns.

## Acceptance Criteria

1. The old footer fields (`note`, `owner`, `records`, `links`) are removed from the effective frontend/footer implementation and replaced by the new structured model.
2. Editors can configure a localized brand area with optional logo and optional brand link.
3. Editors can configure multiple footer navigation groups entirely from Payload.
4. Editors can configure social links and contact items as dedicated footer sections.
5. Editors can configure legal links plus compliance filings and a bottom note.
6. Footer links support both internal localized routes and external URLs.
7. The frontend renders only valid configured content and degrades gracefully when some footer sections are incomplete.
8. The resulting footer feels visually consistent with the site's editorial frontend rather than like an unrelated utility block.
9. The implementation is covered by targeted tests and validated with generated types and TypeScript checks.
