# Editorial Frontend Refresh Design

**Date:** 2026-04-02

**Goal:** Refresh the frontend visual language to follow an editorial style inspired by the StyleKit Editorial reference while preserving the current reading experience, information architecture, and Payload-backed content model.

## Scope

- Restyle the frontend global shell used by the public site:
  - shared color tokens
  - typography
  - spacing rhythm
  - link and button treatment
  - footer presentation
- Redesign the localized homepage in [`src/app/(frontend)/[locale]/page.tsx`](/home/zenor0/projects/zblog/src/app/(frontend)/[locale]/page.tsx) to feel like an editorial cover plus index page.
- Redesign the article page in [`src/components/frontend/PostArticle.tsx`](/home/zenor0/projects/zblog/src/components/frontend/PostArticle.tsx) to feel like a carefully typeset editorial reading layout.
- Introduce a more editorial type pairing through the root layout in [`src/app/layout.tsx`](/home/zenor0/projects/zblog/src/app/layout.tsx).
- Update shared frontend styles in [`src/app/(frontend)/styles.css`](/home/zenor0/projects/zblog/src/app/(frontend)/styles.css).

## Non-Goals

- No Payload schema changes.
- No changes to admin UI styling.
- No changes to collection queries, endpoints, locale resolution, or content loading logic.
- No dedicated redesign pass for frontend routes outside the homepage, article page, footer, and styles that naturally inherit from shared frontend tokens.
- No attempt to reproduce the StyleKit reference page literally.

## Reference Adaptation

### Source signals

The design direction pulls these stable ideas from the StyleKit Editorial reference:

- strong serif display typography
- restrained monochrome palette
- sharp corners and thin borders
- large, deliberate whitespace
- hierarchy created through type, spacing, and dividers instead of shadows or saturated fills

### Intentional divergence

The project should not fully mimic the reference because this site carries denser long-form reading flows and more metadata than a style showcase. The implementation should preserve usability first and use editorial styling as the wrapper around the current experience.

## Visual System

### Color

- Use a pure white page background rather than a warm off-white surface.
- Use a softened near-black for primary text instead of harsh absolute black.
- Build hierarchy mostly through opacity and muted neutrals rather than bright accent colors.
- Keep borders light and crisp.
- Preserve semantic notice states, but mute their saturation and background weight so they do not dominate long-form reading.

### Typography

- Use a serif display font for page titles, section headings, and other editorial headline moments.
- Use a clean sans-serif font for paragraphs, navigation, and interface text.
- Keep monospace for auxiliary metadata and technical inline content where it already improves scanning.
- Increase the contrast between headline scale and body scale on the homepage and article header.

### Shape and surfaces

- Prefer sharp corners throughout the public frontend.
- Remove default card-like softness from badges, buttons, and framed modules where possible.
- Avoid decorative shadows.
- Rely on lines, spacing, and type hierarchy to separate sections.

### Motion and interaction

- Keep motion restrained.
- Use understated underline, border-color, opacity, and text-color transitions.
- Avoid large transforms, bouncy hover states, gradients, and glossy UI cues.

## Homepage Design

### Overall structure

- Treat the homepage as a hybrid of magazine cover and issue index.
- Preserve the current content meaning:
  - site label
  - hero title
  - hero description
  - locale switching
  - list of published posts

### Hero

- Expand the hero into a stronger editorial masthead with more whitespace.
- Keep the primary focus on the title and description.
- Place language switching and compact site metadata in a secondary position so they remain available without competing with the headline.

### Post listing

- Promote the first published post into a featured editorial slot.
- Render remaining posts in a more index-like vertical rhythm rather than a generic feed.
- Make the title the dominant signal, with date and translation state as lighter metadata.
- Keep cover media rectangular and restrained, with sharp edges and light framing when needed.

### Metadata treatment

- Reduce the visual weight of existing badge-like elements.
- Shift dates, translation state, and tags toward editorial metadata styling:
  - smaller scale
  - lighter borders or separators
  - stronger spacing discipline
- Preserve scanability without letting metadata overpower titles and excerpts.

### Empty state

- Present the no-posts state as editorial copy, not as a product-style system message.

## Article Page Design

### Header

- Reframe the article top section as an editorial front matter block.
- Keep back navigation, locale switching, reading time, date, language, and version history available.
- Reduce UI chrome so the article title and excerpt become the only dominant elements.

### Title and intro

- Increase whitespace around the article title.
- Use stronger serif hierarchy for the headline.
- Constrain the excerpt to a comfortable line length beneath the title.
- Position the hero media, when present, as a lead visual directly after the article header rather than as a utility card.

### Reading column

- Maintain a controlled line length for body copy.
- Tune spacing for paragraphs, lists, headings, blockquotes, figures, citations, and references to align with editorial reading.
- Favor consistency and readability over decorative effects.
- Keep inline code and code blocks readable even if they remain visually distinct from prose.

### Table of contents

- Preserve the table of contents because it is useful for long-form content.
- Restyle it as a light index rail rather than a tool panel.
- Keep sticky behavior only where it continues to help navigation.

### Supplementary sections

- Keep tags, attachments, bibliography, preview notices, fallback notices, and translation notices.
- Reduce the sense that they are default component library widgets.
- Present them more like editorial side notes or appendices.

## Footer Design

- Restyle the footer to match the same editorial vocabulary as the rest of the frontend.
- Preserve the current information model:
  - note
  - owner and copyright
  - records
  - outbound links
- Use typography, separators, and spacing rather than product-style pills and button treatments as the main visual structure.

## Component and File Strategy

### Primary files

- [`src/app/layout.tsx`](/home/zenor0/projects/zblog/src/app/layout.tsx)
  - load and expose the new public type pairing
- [`src/app/(frontend)/styles.css`](/home/zenor0/projects/zblog/src/app/(frontend)/styles.css)
  - define updated frontend tokens and editorial utility patterns
- [`src/app/(frontend)/[locale]/page.tsx`](/home/zenor0/projects/zblog/src/app/(frontend)/[locale]/page.tsx)
  - apply the homepage layout changes
- [`src/components/frontend/PostArticle.tsx`](/home/zenor0/projects/zblog/src/components/frontend/PostArticle.tsx)
  - apply the article layout and metadata treatment changes
- [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx)
  - align footer layout and controls with the editorial system

### Secondary compatibility checks

- Ensure existing shared components used by those pages still fit the new tone:
  - locale switcher
  - media surfaces
  - table of contents
  - alerts and badges where still retained

## Constraints

- Background must stay pure white.
- The site should feel editorial without sacrificing readability on dense article pages.
- Mobile layouts must remain natural and not collapse under larger heading scales or added whitespace.
- The redesign should reduce the visible default shadcn look, especially for badges, buttons, and card-like modules.

## Error Handling and Edge Cases

- Homepage must continue to work when there are zero posts.
- Homepage must continue to work when posts do not have hero images or tags.
- Article pages must continue to read well when:
  - there is no hero image
  - there is no excerpt
  - there are no supplementary sections
  - notices are present
  - the table of contents is absent
- Existing semantic notice color differences should remain understandable even after visual desaturation.

## Testing and Verification

- Validate responsive behavior on homepage and article page.
- Run `tsc --noEmit` after implementation.
- Run any targeted frontend or integration tests that cover article rendering if code changes affect shared rendering behavior.
- Manually verify that the redesigned pages still preserve:
  - locale switching
  - article navigation
  - version history access
  - metadata readability
  - attachment and bibliography usability

## Acceptance Criteria

1. The homepage and article page clearly read as editorial in tone through typography, whitespace, and hierarchy rather than through decorative effects.
2. Long-form reading is at least as usable as before.
3. Homepage and article page feel visually unified.
4. The frontend no longer feels like default shadcn components assembled with light theming.
5. Mobile presentation remains coherent and readable.

## Implementation Notes

- Preferred path:
  1. Introduce fonts and shared editorial tokens.
  2. Refactor homepage hierarchy around featured content plus index rhythm.
  3. Refactor article header, reading column, and supplementary modules.
  4. Restyle footer and any shared frontend controls exposed by those pages.
  5. Verify responsive behavior and TypeScript correctness.
