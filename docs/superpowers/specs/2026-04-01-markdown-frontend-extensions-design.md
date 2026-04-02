# Markdown Frontend Extensions Design

**Date:** 2026-04-01

**Goal:** Extend the frontend Markdown renderer to support article cross-references for labeled figures and tables, render table captions, and formalize fenced `tsx` code block support without adopting MDX execution.

## Scope

- Keep the existing `react-markdown` rendering pipeline in [`src/lib/markdown.tsx`](/home/zenor0/projects/zblog/src/lib/markdown.tsx).
- Continue existing bibliography citation behavior for `[@key]`.
- Add article element cross-references for:
  - `[@fig:<label>]`
  - `[@tbl:<label>]`
- Add labeled figure syntax for Markdown images:
  - `![Alt](/path/to/image.png "Caption"){#fig:overview}`
- Add table caption syntax for GFM tables:
  - a paragraph immediately following a table, beginning with `:`
  - optional trailing label: `{#tbl:benchmark}`
- Keep `tsx` support to fenced code blocks only. Do not adopt MDX or execute JSX/TSX in article content.

## Non-Goals

- No MDX execution model.
- No arbitrary JSX component rendering in article bodies.
- No new CMS schema changes.
- No changes to bibliography storage or reference section layout.

## Rendering Semantics

### Bibliography citations

- `[@smith2024]` remains a numbered citation link to `#reference-1`.
- `[@smith2024; @chen2023]` continues to render a grouped inline citation.

### Figure references

- A paragraph containing a single Markdown image followed by `{#fig:<label>}` becomes a labeled figure target.
- The frontend creates a deterministic anchor for the figure.
- `[@fig:<label>]` renders as an inline link such as `Figure 1`.
- Existing unlabeled images continue rendering unchanged.

### Table captions and references

- A GFM table followed immediately by a paragraph beginning with `:` is treated as a caption for that table.
- If the caption ends with `{#tbl:<label>}`, the table also becomes a labeled target.
- The frontend renders the caption visibly with numbering such as `Table 1. Benchmark results`.
- `[@tbl:<label>]` renders as an inline link such as `Table 1`.
- Tables without captions continue rendering as normal GFM tables.

### Fenced `tsx` code blocks

- ` ```tsx ` is treated as a normal fenced code block language.
- The frontend preserves the language class and exposes the language label in the rendered UI.
- No code execution, compilation, or import resolution occurs.

## Internal Design

## AST transform layer

- Add a Markdown article-elements pass before citation replacement.
- This pass will:
  - detect labeled figure paragraphs
  - detect table caption paragraphs
  - assign per-kind numbering
  - create stable anchor ids
  - store a registry of labeled article elements on the root tree
  - annotate figure/table nodes with render metadata

## Citation replacement layer

- Extend citation replacement to classify each `[@...]` token as either:
  - bibliography citation
  - article cross-reference
- Bibliography citations continue using the existing `citationIndex`.
- Article cross-references resolve against the article-element registry built from the AST.
- Unresolved article references remain visibly degraded rather than disappearing silently.

## Render layer

- Add custom paragraph rendering for labeled figures.
- Add custom table rendering for captioned/labeled tables.
- Add custom pre/code rendering to expose language labels consistently.
- Keep image/media resolution through the existing media helpers.

## Error Handling

- Missing article references do not crash rendering.
- Invalid or unsupported labels are ignored as targets and remain visible as unresolved references.
- Existing markdown that does not use the new syntax must render exactly as before.

## Testing

- Add integration tests covering:
  - labeled figure anchor generation and `[@fig:]` rendering
  - table caption extraction and `[@tbl:]` rendering
  - unresolved article references
  - fenced `tsx` code block language output
- Run targeted Vitest coverage for the new renderer behavior.
- Run `tsc --noEmit` after implementation.

