# GitHub Callouts Design

**Date:** 2026-04-02

**Goal:** Replace the current directive-style Markdown callout syntax with GitHub-style blockquote callouts, add case-insensitive label matching with graceful fallback for unknown labels, and redesign the frontend callout presentation so each semantic type is visually distinguishable while staying close to GitHub's native visual language.

## Scope

- Support GitHub-style callouts in post Markdown content:
  - `> [!NOTE]`
  - `> [!TIP]`
  - `> [!IMPORTANT]`
  - `> [!WARNING]`
  - `> [!CAUTION]`
- Match callout labels case-insensitively, so lowercase and mixed-case markers are accepted.
- Render unknown but syntactically valid callout labels as callouts with a neutral fallback style.
- Update frontend callout markup and styles to expose semantic differences more clearly.
- Update editor-facing help text and seeded showcase content to use the new syntax.

## Non-Goals

- No support for the previous `:::note` / `:::tip` directive syntax after this change.
- No CMS schema changes.
- No MDX adoption or arbitrary JSX execution changes.
- No change to ordinary blockquote semantics outside the new callout detection rule.

## Syntax Rules

### Supported trigger

- A blockquote becomes a callout only when its first meaningful inline text begins with a GitHub-style marker: `[!label]`.
- The marker is recognized case-insensitively.
- The label must be non-empty and composed of visible non-`]` characters.

### Known labels

- `note`
- `tip`
- `important`
- `warning`
- `caution`

### Unknown labels

- Any syntactically valid label outside the predefined set still renders as a callout.
- Unknown labels use a neutral fallback appearance instead of degrading to a plain blockquote.
- The displayed title is normalized into readable title case. Example:
  - `[!research notes]` -> `Research Notes`

### Non-callout blockquotes

- A blockquote without a leading `[!label]` marker remains a normal blockquote.
- A blockquote whose marker does not appear at the start of the first meaningful inline text remains a normal blockquote.

## Rendering Semantics

### AST detection

- Replace the current directive-based callout detection in [`src/lib/markdown/plugins.ts`](/home/zenor0/projects/zblog/src/lib/markdown/plugins.ts) with a remark plugin that inspects parsed `blockquote` nodes.
- The plugin identifies callouts from blockquote content rather than from source-text rewrites.
- When a node is recognized as a callout, the marker is removed from the visible content and metadata is attached to the node.

### Output shape

- Callouts continue rendering through the existing custom `aside` renderer in [`src/lib/markdown/index.tsx`](/home/zenor0/projects/zblog/src/lib/markdown/index.tsx).
- The transformed node renders with:
  - `class="md-callout md-callout--<kind>"`
  - `data-kind="<kind>"`
  - `data-callout-label="<display label>"`
- Unknown labels also receive:
  - `class="md-callout--custom"`

### Content structure

- The marker line is not shown verbatim in the rendered article.
- Multi-paragraph blockquote content remains intact inside the callout.
- Existing paragraph, link, list, code, and nested Markdown rendering inside the blockquote continues to work.

## Visual Design

### Direction

- Follow a restrained GitHub-like presentation rather than a heavy card component.
- The visual shell consists of:
  - a left accent border
  - a shallow tinted background
  - a title row with an icon and label
  - normal article body typography below the title row

### Semantic differentiation

- `note`: blue
- `tip`: green
- `important`: magenta-violet accent
- `warning`: amber
- `caution`: red
- unknown/custom: neutral slate-blue fallback

### Blockquote separation

- Regular blockquotes keep their existing simpler quote styling.
- Callouts must be visually distinct from regular blockquotes even when the semantic color is subtle.

## Internal Design

### Parsing helpers

- Add helper logic to:
  - extract the first meaningful text segment from a blockquote
  - parse and normalize a `[!label]` marker
  - format normalized labels into display text
  - classify known labels vs custom labels

### Plugin changes

- Remove the directive-oriented callout plugin from the Markdown pipeline.
- Add a blockquote-oriented callout plugin before later renderer-oriented passes.
- Keep the rest of the Markdown pipeline unchanged unless required for typing or node-shape compatibility.

### Renderer changes

- Extend the custom `aside` renderer so it can emit a title row based on node properties.
- Avoid introducing a separate React component file unless the renderer becomes materially more complex.
- Keep callout rendering local to the Markdown renderer to preserve the current pipeline shape.

### Styling changes

- Replace the current minimal `.md-callout` rules in [`src/app/(frontend)/styles.css`](/home/zenor0/projects/zblog/src/app/(frontend)/styles.css) with a richer callout treatment.
- Add rules for:
  - shared callout structure
  - title row
  - icon wrapper
  - semantic variants
  - custom fallback variant
- Leave ordinary `blockquote` rules intact except for any small adjustments needed to maintain visual separation.

## Content and Editor Updates

- Update the editor help text in [`src/collections/Posts.ts`](/home/zenor0/projects/zblog/src/collections/Posts.ts) to document GitHub-style syntax instead of directive syntax.
- Update seeded Markdown showcase content in [`src/lib/seed-blog-content.ts`](/home/zenor0/projects/zblog/src/lib/seed-blog-content.ts) so examples reflect the new canonical syntax.

## Error Handling

- Invalid or missing markers do not crash rendering.
- Unknown labels render with fallback styling instead of failing closed to plain text.
- Standard blockquotes continue rendering unchanged when not recognized as callouts.
- Existing Markdown features such as citations, figures, tables, and fenced code blocks must continue rendering as before.

## Testing

- Add integration coverage in [`tests/int/markdown-renderer.int.spec.ts`](/home/zenor0/projects/zblog/tests/int/markdown-renderer.int.spec.ts) for:
  - known GitHub callout labels
  - case-insensitive matching
  - custom-label fallback rendering
  - multi-paragraph callout content
  - non-callout blockquote preservation
- Do not add string-rewrite callout tests in [`tests/int/markdown-syntax.int.spec.ts`](/home/zenor0/projects/zblog/tests/int/markdown-syntax.int.spec.ts) if callout support moves entirely to AST parsing.
- Run targeted tests plus `tsc --noEmit` during implementation.

## Implementation Notes

- Preferred implementation path:
  1. Add failing renderer tests for GitHub callout parsing and rendering.
  2. Replace the directive callout plugin with AST-based blockquote detection.
  3. Update the `aside` renderer and frontend styles.
  4. Update editor descriptions and seeded showcase content.
  5. Run targeted verification and TypeScript validation.
