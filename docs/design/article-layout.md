# Article Layout

## Purpose

The article layout system controls long-form typography, rich block spacing, reading column width, and article block rhythm. It gives production pages a code-owned default while allowing a small set of safe admin overrides.

The implementation lives in `src/lib/article-design.ts`; `src/lib/article-layout.ts` re-exports the same API for layout-oriented imports.

## Presets

Available preset IDs:

- `compact-editorial`: default production preset. Serif headings, dense sans body copy, JetBrains Mono code, and a `70ch` reading column.
- `balanced-editorial`: slightly more relaxed long-form rhythm with wider gaps and a `66ch` reading column.
- `current`: no article design token injection; useful as a compatibility baseline.

The default preset is `compact-editorial`.

## Token Model

Presets resolve to CSS custom properties for:

- reading column width and article grid gap
- body font size, line height, flow gap, and paragraph gap
- H2, H3, and H4 size, line height, and margins
- rich block spacing for figures, tables, code blocks, media, and callouts
- caption spacing
- code block font, size, line height, padding, background, and border
- table cell padding
- article block colors and borders
- Latin, CJK, heading, and code font stacks

Production pages consume the resolved style object through article layout attributes and frontend CSS.

## Admin Controls

`SiteSettings.articleLayout` exposes:

- preset selection
- optional typography overrides for Latin, CJK, heading, and code fonts
- optional safe length overrides for content width, font size, paragraph gap, flow gap, block gap, caption gap, and grid gap
- optional unitless body line-height override
- a preview component for checking the resulting article rhythm

Validation accepts only positive CSS lengths in `px`, `rem`, `em`, or `ch`, and unitless positive line-height values.

## Layout Rules

- Body copy should maintain a controlled line length instead of stretching across wide screens.
- Rich blocks should interrupt the flow more deliberately than ordinary paragraphs.
- Captions should stay visually close to the media or table they describe.
- Heading spacing should bind headings to their following content.
- Code and tables need enough density for technical articles without overpowering prose.

## Development Lab

`/dev/article-layout` renders the production `PostArticle` with demo content and media overrides. It is used to evaluate article rhythm without editing production posts.

The demo content covers:

- headings from H2 to H4
- dense and loose paragraphs
- lists and blockquotes
- GitHub-style callouts
- labeled figures
- GFM tables with captions
- fenced code blocks
- whitelisted Markdown components

The lab should remain development-only and must not make production article pages client-switchable.

## Verification

Use targeted tests for:

- preset resolution and fallback
- token validation
- admin settings field configuration
- preview rendering
- article layout lab registration and demo Markdown coverage
