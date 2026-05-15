import type { AppLocale } from '@/shared/i18n/locales'

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

type SeedPostLocaleCopy = {
  excerpt: string
  title: string
}

export const seedCitationDemoCopy = {
  en: {
    excerpt: 'Machine-translated seeded content for locale switching.',
    title: 'Seed Post with Citations and Version History',
  },
  'zh-Hans': {
    excerpt: '覆盖 Markdown、引用、翻译和版本历史的 seed 示例文章。',
    title: '带引用与版本历史的示例文章',
  },
} as const satisfies Record<AppLocale, SeedPostLocaleCopy>

export const seedCitationDemoRevisionCopy = {
  'zh-Hans': {
    excerpt: '第二版内容，额外增加一段文字用于验证 diff。',
    title: '带引用与版本历史的示例文章（修订）',
  },
} as const satisfies Partial<Record<AppLocale, SeedPostLocaleCopy>>

export const seedFallbackDemoCopy = {
  'zh-Hans': {
    excerpt: '用于验证语言回退行为的中文-only seed 示例文章。',
    title: '语言回退示例文章',
  },
} as const satisfies Partial<Record<AppLocale, SeedPostLocaleCopy>>

export const seedMarkdownShowcaseCopy = {
  en: {
    excerpt: 'Seeded showcase article for the frontend Markdown feature set.',
    title: 'Markdown Feature Showcase',
  },
  'zh-Hans': {
    excerpt: '端到端覆盖当前 Markdown 渲染能力的 seed 示例文章。',
    title: 'Markdown 能力展示文章',
  },
} as const satisfies Record<AppLocale, SeedPostLocaleCopy>

export const seedMarkdownShowcaseZhTitle = seedMarkdownShowcaseCopy['zh-Hans'].title
export const seedMarkdownShowcaseEnTitle = seedMarkdownShowcaseCopy.en.title

export function buildZhCitationDemoContent(heroURL: string) {
  return `# 为什么博客需要显式引用

一个长期维护的技术博客，最终会遇到同一类问题：信息来源是否清晰、翻译版本是否可信、以及历史修改是否能被追踪。这里我们用 [@smith2024] 和 [@chen2023] 作为最小示例。

> 如果文章包含研究结论或者实践数据，引用本身就是内容的一部分，而不是附录。

:::note
这个 seed post 同时覆盖了 Markdown、BibTeX、附件、图片和版本历史。
:::

![Seed hero](${heroURL})

## 一个极简但够用的结构

- 正文仍然用 Markdown 编写，便于 diff。
- 引用键直接写在内容里，例如 [@smith2024]。
- BibTeX 文本跟随文章一起存储，由系统负责校验。
- 附件放在侧边栏区域，而不是塞进正文里。

## 版本记录为什么重要

发布之后再改动内容时，应该能清楚看到标题、摘要和正文到底改了什么，而不是只看到“更新于某日”。
`
}

export function buildZhCitationDemoContentV2(heroURL: string) {
  return `${buildZhCitationDemoContent(heroURL)}

## 第二次修订

这一版额外补充了一个段落，用来生成可读的版本 diff，并验证历史页面确实能看到新增内容。
`
}

export function buildEnCitationDemoContent(heroURL: string) {
  return `# Why a blog should keep explicit citations

A long-lived technical blog eventually faces the same questions: where the claims come from, whether translated pages can be trusted, and how revisions can be inspected over time. This seeded article references [@smith2024] and [@chen2023].

> For research-heavy writing, citations are part of the reading experience rather than an appendix.

:::note
This seeded entry covers Markdown rendering, BibTeX references, attachments, images, and version history.
:::

![Seed hero](${heroURL})

## A deliberately small structure

- Keep the main body in Markdown for readable diffs.
- Insert citation keys inline, such as [@smith2024].
- Store one BibTeX source directly on the post and validate against it.
- Keep downloadable assets in a dedicated attachments section.
`
}

export function buildZhFallbackDemoContent() {
  return `# 只有中文的回退示例

这篇文章只有中文版本，用来验证英文路由下是否会正确显示 fallback 提示。

## 这篇文章覆盖什么

- locale fallback
- 极简正文阅读
- 版本列表入口
`
}

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
