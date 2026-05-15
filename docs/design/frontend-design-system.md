# Frontend Design System

## Direction

The public frontend should feel editorial: quiet, type-led, readable, and restrained. The design language uses typography, spacing, borders, and hierarchy instead of decorative effects.

The main implementation surface is `src/app/(frontend)/styles.css`, with design references available under `/dev`.

## Principles

- Prioritize long-form reading over visual novelty.
- Use semantic tokens and shared component patterns before introducing local one-off styles.
- Keep the page background clean and stable.
- Use muted neutrals for hierarchy; reserve saturated color for semantic states.
- Prefer sharp borders, simple dividers, and deliberate whitespace over shadows and rounded card stacks.
- Keep motion subtle and useful: opacity, underline, border color, or small state transitions.

## Typography

The frontend uses an editorial pairing:

- serif display type for page titles, article headings, and strong editorial moments
- sans-serif type for body copy, navigation, controls, metadata, and dense UI
- monospace for code, citations, diagnostics, and technical metadata

Article-specific font stacks are controlled by the article design system. See [Article layout](./article-layout.md).

## Color and Surfaces

The system favors:

- white or near-white page surfaces
- softened near-black foreground text
- light borders for structure
- muted backgrounds for secondary panels
- desaturated semantic colors for notices and callouts
- a CMS-configured brand accent for small details such as link underlines, progress indicators, media chrome, and footer hierarchy

Avoid product-dashboard visual language in public reading surfaces: heavy cards, glossy gradients, decorative shadows, oversized pill badges, and saturated section backgrounds.

The brand accent is exposed as `SiteSettings.appearance.accentColor` and resolved into `--zblog-accent`. It should not replace shadcn's neutral `--accent` surface token; keep it to low-area emphasis so long-form reading remains calm.

## Homepage

The localized homepage acts like an editorial cover plus issue index.

Expected hierarchy:

- localized site identity and hero copy from `SiteSettings`
- locale switching that remains available but visually secondary
- featured first post when published content exists
- remaining posts in an index-like rhythm
- restrained metadata for date, language, translation state, and tags
- a quiet empty state when no posts exist

## Article Page

The article page is a front matter block plus reading layout.

Expected behavior:

- back navigation, locale switching, reading metadata, and history links stay available
- title and excerpt dominate the page header
- hero media behaves as a lead visual, not as a utility card
- body copy uses controlled line length and stable line height
- table of contents reads as an index rail
- tags, attachments, bibliography, preview notices, and translation notices render as appendices or side notes

## Article Blocks

Markdown output must expose stable block semantics through classes and `data-article-block` attributes.

The maintained article block families include:

- paragraph
- heading
- list
- blockquote
- callout
- inline code
- code block
- figure
- media
- table
- citation link
- notice card
- feature grid
- divider

The `/dev/design-system/article-blocks` pages provide static samples for block states, while `/dev/article-layout` validates the same block types inside the production article shell.

## Component Use

Frontend components may use shadcn primitives, but public pages should not look like default component-library examples. Prefer composition through project-level classes and editorial tokens.

Controls should remain predictable:

- links use clear underline or text-state treatment
- buttons are reserved for explicit actions
- badges are metadata, not decoration
- cards are for actual repeated items or framed tools, not for every page section

## Verification

When changing public design:

- inspect homepage and article pages on mobile and desktop
- check long titles, missing images, empty metadata, and notice-heavy articles
- run targeted article/Markdown rendering tests when markup changes
- keep `/dev/design-system` and `/dev/article-layout` aligned with production styles
