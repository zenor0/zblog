const tsxShowcaseSnippet = [
  '```tsx',
  "export function NoticeCard({ title }: { title: string }) {",
  '  return (',
  '    <section className="notice-card">',
  '      <h3>{title}</h3>',
  '      <p>This remains a code example rather than executable JSX.</p>',
  '    </section>',
  '  )',
  '}',
  '```',
].join('\n')

export const seedCitationDemoSlug = 'seed-citation-demo'
export const seedFallbackDemoSlug = 'seed-fallback-demo'
export const seedMarkdownShowcaseSlug = 'seed-markdown-showcase'

export const seedMarkdownShowcaseZhTitle = 'Markdown 能力展示文章'
export const seedMarkdownShowcaseEnTitle = 'Markdown Feature Showcase'

export function buildZhMarkdownShowcaseContent(figureURL: string) {
  return `# Markdown 能力展示

这篇 seed 文章专门用来展示博客前端当前支持的 Markdown 能力，包括引用 [@smith2024]、文内交叉引用、表格 caption、callout、代码块和基础排版。

## Callout 展示

下面这一组例子专门展示 GitHub 风格 callout 在当前前端里的语义差异，以及自定义 label 的 fallback 效果。

> [!NOTE]
> 适合补充背景信息、阅读上下文或不影响主结论的说明。

> [!TIP]
> 适合给出更高效的写作、编辑或排版建议。

> [!IMPORTANT]
> 适合标记读者在继续阅读前必须知道的约束条件。

> [!WARNING]
> 适合强调误用风险、兼容性限制或功能边界。

> [!CAUTION]
> 适合提示可能导致错误发布、数据丢失或不可逆修改的操作。

> [!research notes]
> 自定义 label 也会被渲染为 callout，可用来承载团队特定语义。

## 文本与链接

你可以在正文里混合使用 **粗体**、_斜体_、\`inline code\` 和普通链接，例如 [Payload CMS 文档](https://payloadcms.com/docs)。

> 当一套内容系统开始支持引用、图表和结构化代码块时，它就不只是“能发文章”，而是开始具备技术出版的骨架。

---

## 列表与提示块

- 无序列表适合快速罗列能力点。
- 有序列表适合展示步骤。
- callout 适合强调上下文或风险。

1. 先写正文。
2. 再补引用。
3. 最后检查文内交叉引用是否正确落点。

## 图表与交叉引用

下方的 [@fig:seed-hero] 和 [@tbl:feature-matrix] 分别展示了图片锚点和表格 caption 的文内引用能力。

![Seed hero showcase](${figureURL}){#fig:seed-hero}

| Feature | Status |
| --- | --- |
| Citation bibliography | Native |
| Figure references | Native |
| Table captions | Native |
| Rendered markdown components | Native |
| TSX fenced blocks | Native |

: 前端 Markdown 能力矩阵 {#tbl:feature-matrix}

## 受控组件渲染

下面这两个例子展示了白名单组件的渲染能力。语法看起来像 TSX，但并不会执行任意代码，只会映射到系统内置组件。

<NoticeCard tone="info" title="受控组件渲染">
这里的正文仍然走 Markdown 解析，所以你可以继续使用 **强调**、链接和普通段落。
</NoticeCard>

<FeatureGrid items='[{"title":"Citation","status":"原生支持"},{"title":"Figure refs","status":"文内锚点"},{"title":"Table captions","status":"标题显示"},{"title":"TSX-like blocks","status":"受控渲染"}]' />

## 代码块

下面是一段 \`tsx\` fenced code block，应该被渲染为带语言标签的代码块，而不是组件执行结果。

${tsxShowcaseSnippet}

## 小结

如果你需要一篇文章同时验证标题目录、引用、图片、表格、callout、排版和代码块，这一篇就是系统能力的完整样本。`
}

export function buildEnMarkdownShowcaseContent(figureURL: string) {
  return `# Markdown Feature Showcase

This seeded article is a single place to demonstrate the blog frontend's current Markdown capabilities: citations like [@smith2024], article cross-references, table captions, callouts, code fences, and rich text formatting.

## Callout showcase

The examples below show the built-in GitHub-style callout types plus the fallback rendering for a custom label.

> [!NOTE]
> Use this for supporting context that helps the reader without changing the main conclusion.

> [!TIP]
> Use this for workflow shortcuts, authoring guidance, or editorial best practices.

> [!IMPORTANT]
> Use this when the reader must know a constraint before continuing.

> [!WARNING]
> Use this for misuse risks, compatibility limits, or operational boundaries.

> [!CAUTION]
> Use this for actions that could lead to bad publishes, data loss, or irreversible changes.

> [!research notes]
> Custom labels still render as callouts, so teams can layer in project-specific semantics.

## Text and links

The article body can mix **strong text**, _emphasis_, \`inline code\`, and ordinary links such as [Payload CMS docs](https://payloadcms.com/docs).

> Once a publishing system supports references, labeled figures, captioned tables, and structured code blocks, it starts behaving more like technical publishing than plain blogging.

---

## Lists and callouts

- Unordered lists summarize capabilities quickly.
- Ordered lists work well for sequences.
- Callouts help surface context and constraints.

1. Draft the content.
2. Insert references.
3. Verify that every in-article reference resolves correctly.

## Figures, tables, and cross-references

The [@fig:seed-hero] and [@tbl:feature-matrix] references below demonstrate article anchors for labeled images and captioned tables.

![Seed hero showcase](${figureURL}){#fig:seed-hero}

| Feature | Status |
| --- | --- |
| Citation bibliography | Native |
| Figure references | Native |
| Table captions | Native |
| Rendered markdown components | Native |
| TSX fenced blocks | Native |

: Frontend Markdown capability matrix {#tbl:feature-matrix}

## Controlled component rendering

The examples below use a JSX-like surface, but they do not execute arbitrary React code. They are mapped onto a small whitelist of built-in frontend components.

<NoticeCard tone="info" title="Rendered component">
The body still flows through the Markdown parser, so ordinary paragraphs, emphasis, and links keep working inside the component.
</NoticeCard>

<FeatureGrid items='[{"title":"Citation","status":"native"},{"title":"Figure refs","status":"anchored"},{"title":"Table captions","status":"captioned"},{"title":"TSX-like blocks","status":"controlled"}]' />

## Code blocks

The fenced \`tsx\` block below should render as a labeled code block rather than an executed component.

${tsxShowcaseSnippet}

## Wrap-up

If you need a single article that exercises headings, citations, labeled figures, captioned tables, callouts, rich text, and code fences, this is the seeded system showcase.`
}
