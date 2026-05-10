# Markdown Rendering

## Purpose

The frontend Markdown renderer supports technical-publishing features while deliberately avoiding MDX execution. Markdown remains authorable in Payload and renderable through a controlled `react-markdown` pipeline.

The renderer lives under `src/lib/markdown/`.

## Pipeline

`MarkdownRenderer`:

1. preprocesses source with `prepareMarkdownSource`
2. runs `remark-gfm`
3. runs `remark-directive`
4. detects GitHub-style blockquote callouts
5. detects article elements such as labeled figures and captioned tables
6. maps whitelisted component directives to known React components
7. replaces citation tokens with bibliography links or article cross-reference links
8. renders through custom React renderers for links, headings, images, figures, tables, code, callouts, and whitelisted components

The pipeline must not evaluate arbitrary JSX, import modules from article content, or execute code blocks.

## Citations and Article References

Bibliography citations use `[@key]` and resolve through the citation index built from the post bibliography.

Grouped citations are supported:

```markdown
See [@smith2024; @chen2023].
```

Article element references use reserved prefixes and do not count as bibliography keys:

```markdown
See [@fig:overview] and [@tbl:benchmark].
```

Unresolved bibliography citations render visibly as missing references. Unresolved article references render as degraded inline markers instead of disappearing.

## Figures

A paragraph containing one Markdown image followed by a label becomes a numbered figure:

```markdown
![Alt text](/media/example.png 'Caption'){#fig:overview}
```

The renderer assigns a stable anchor, adds figure metadata, and renders references as localized labels such as `Figure 1` or `图 1`.

Unlabeled images continue to render as normal Markdown media.

## Tables

GFM tables are supported. A paragraph immediately following a table and beginning with `:` is treated as the table caption:

```markdown
| Metric | Value |
| ------ | ----- |
| Build  | 42s   |

: Benchmark result {#tbl:benchmark}
```

When a label is present, the table becomes a numbered reference target.

## GitHub Callouts

Blockquotes become callouts only when the first meaningful text begins with a GitHub-style marker:

```markdown
> [!NOTE]
> This is a note.
```

Known labels:

- `note`
- `tip`
- `important`
- `warning`
- `caution`

Labels are matched case-insensitively. Unknown labels render as custom callouts with neutral fallback styling and title-cased labels.

Ordinary blockquotes remain blockquotes when they do not start with a callout marker.

## Code Blocks

Fenced code blocks preserve their language and render a language label:

````markdown
```tsx
export function Example() {
  return <span>Hello</span>
}
```
````

The renderer may highlight code for supported languages, but it never compiles or executes code.

Inline code remains inline text with article-block metadata.

## Whitelisted Components

Only explicit block-level JSX-like component syntax is supported, and only for known components:

- `NoticeCard`
- `FeatureGrid`

Examples:

```markdown
<NoticeCard title="Draft note" tone="info">
This body still flows through Markdown.
</NoticeCard>

<FeatureGrid items='[{"title":"Flow","status":"Ready","description":"Body rhythm stays readable."}]' />
```

The preprocess step rewrites supported tags into remark directives before parsing. Unknown tags are not executed as React components.

Component constraints:

- attributes are strings
- structured values are passed as JSON text
- container bodies still use normal Markdown parsing
- support is block-level only

## Link Previews

The custom link renderer can attach preview metadata for:

- bibliography citations
- article element references
- headings
- external links with fallback preview data

External HTTP links open in a new tab with `rel="noreferrer"`.

## Seed Showcase

Seeded blog content includes a Markdown showcase article that demonstrates:

- bibliography citations
- article references
- figures
- tables with captions
- GitHub callouts
- fenced code blocks
- `NoticeCard`
- `FeatureGrid`

Keep seed content aligned when adding or removing renderer capabilities.

## Verification

Use targeted tests for:

- callout detection and fallback labels
- non-callout blockquote preservation
- figure and table numbering
- localized article labels
- missing article references
- fenced code block language output
- whitelist component preprocessing and rendering
- seeded showcase coverage
- `pnpm exec tsc --noEmit`
