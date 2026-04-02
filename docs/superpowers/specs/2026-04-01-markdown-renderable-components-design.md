# Markdown Renderable Components Design

**Date:** 2026-04-01

**Goal:** Extend the existing Markdown frontend work so figure/table labels are localized per article locale, and a small whitelist of JSX-like blocks can render as real frontend components without introducing full MDX execution.

## Scope

- Keep the existing `react-markdown` pipeline under [`src/lib/markdown/`](/home/zenor0/projects/zblog/src/lib/markdown).
- Localize visible figure/table labels for:
  - figure captions
  - table captions
  - `[@fig:<label>]` and `[@tbl:<label>]` cross-references
- Support block-level JSX-like syntax for a fixed whitelist of components:
  - `<NoticeCard ...>...</NoticeCard>`
  - `<FeatureGrid ... />`
- Update the seeded showcase article so it demonstrates rendered components in addition to citations, figures, tables, callouts, and fenced `tsx` code.

## Non-Goals

- No arbitrary JSX execution.
- No imports, hooks, expressions, or user-defined components in article bodies.
- No schema changes.
- No migration to MDX.

## Rendering Model

### Localized article labels

- `MarkdownRenderer` accepts per-kind label overrides such as `fig: '图'` and `tbl: '表'`.
- `PostArticle` resolves those labels from the active locale and passes them into the renderer.
- The renderer uses those labels consistently in captions and cross-reference links.

### Controlled JSX-like components

- JSX-like syntax is only supported when the tag name is explicitly whitelisted.
- Support is limited to standalone block lines, which keeps parsing simple and avoids ambiguous inline behavior.
- Attributes are treated as strings. Structured data is passed as JSON text and parsed by the receiving component.
- The body of container components still flows through normal Markdown parsing.

### Safety constraints

- The preprocess step rewrites supported JSX-like lines into remark-directive syntax before Markdown parsing.
- Rendering maps the resulting directive nodes onto known React components.
- Unknown tags remain ordinary Markdown/HTML text and do not execute.

## Component Contract

### `NoticeCard`

- Container component with `title` and `tone` attributes.
- Renders its Markdown body content inside a styled card.

### `FeatureGrid`

- Leaf component with an `items` attribute containing JSON text.
- Parses a list of `{ title, status?, description? }` objects and renders a responsive grid.

## Testing

- Add integration coverage for localized figure/table labels.
- Add renderer coverage for whitelist component rendering.
- Add syntax coverage for JSX-like preprocessing.
- Update seeded-content tests and frontend e2e expectations to cover rendered components and localized figure/table text.
