export type ArticleDesignPresetID = 'balanced-editorial' | 'compact-editorial' | 'current'

export type ArticleBlockID =
  | 'blockquote'
  | 'callout'
  | 'citation-link'
  | 'code-block'
  | 'divider'
  | 'feature-grid'
  | 'figure'
  | 'heading'
  | 'inline-code'
  | 'list'
  | 'media'
  | 'notice-card'
  | 'paragraph'
  | 'table'

export type ArticleBlockDefinition = {
  className?: string
  id: ArticleBlockID
  tokenNamespace: string
}

export const articleBlockRegistry = {
  paragraph: {
    id: 'paragraph',
    tokenNamespace: '--article-block-paragraph',
  },
  heading: {
    id: 'heading',
    tokenNamespace: '--article-block-heading',
  },
  list: {
    id: 'list',
    tokenNamespace: '--article-block-list',
  },
  blockquote: {
    id: 'blockquote',
    tokenNamespace: '--article-block-quote',
  },
  callout: {
    className: 'md-callout',
    id: 'callout',
    tokenNamespace: '--article-block-callout',
  },
  'inline-code': {
    id: 'inline-code',
    tokenNamespace: '--article-block-inline-code',
  },
  'code-block': {
    className: 'markdown-codeblock',
    id: 'code-block',
    tokenNamespace: '--article-block-code',
  },
  figure: {
    className: 'markdown-figure',
    id: 'figure',
    tokenNamespace: '--article-block-figure',
  },
  media: {
    className: 'markdown-media',
    id: 'media',
    tokenNamespace: '--article-block-media',
  },
  table: {
    className: 'markdown-figure--table',
    id: 'table',
    tokenNamespace: '--article-block-table',
  },
  'citation-link': {
    className: 'citation-link',
    id: 'citation-link',
    tokenNamespace: '--article-block-citation-link',
  },
  'notice-card': {
    id: 'notice-card',
    tokenNamespace: '--article-block-notice',
  },
  'feature-grid': {
    id: 'feature-grid',
    tokenNamespace: '--article-block-feature-grid',
  },
  divider: {
    id: 'divider',
    tokenNamespace: '--article-block-divider',
  },
} satisfies Record<ArticleBlockID, ArticleBlockDefinition>

export function getArticleBlockDefinition(id: ArticleBlockID) {
  return articleBlockRegistry[id]
}

export const articleDesignTokenNames = [
  '--article-block-callout-padding',
  '--article-block-code-background',
  '--article-block-code-border-color',
  '--article-block-inline-code-background',
  '--article-block-inline-code-border-color',
  '--article-block-media-surface-background',
  '--article-block-quote-border-color',
  '--article-block-quote-padding-left',
  '--article-block-strong-font-weight',
  '--article-block-table-border-color',
  '--article-layout-block-gap',
  '--article-layout-caption-gap',
  '--article-layout-cjk-font-family',
  '--article-layout-code-font-family',
  '--article-layout-code-font-size',
  '--article-layout-code-line-height',
  '--article-layout-code-padding',
  '--article-layout-copy-font-size',
  '--article-layout-copy-line-height',
  '--article-layout-copy-max-width',
  '--article-layout-flow-gap',
  '--article-layout-grid-gap',
  '--article-layout-h2-font-size',
  '--article-layout-h2-line-height',
  '--article-layout-h2-margin-bottom',
  '--article-layout-h2-margin-top',
  '--article-layout-h3-font-size',
  '--article-layout-h3-line-height',
  '--article-layout-h3-margin-bottom',
  '--article-layout-h3-margin-top',
  '--article-layout-h4-font-size',
  '--article-layout-h4-line-height',
  '--article-layout-h4-margin-bottom',
  '--article-layout-h4-margin-top',
  '--article-layout-heading-font-family',
  '--article-layout-latin-font-family',
  '--article-layout-list-block-gap',
  '--article-layout-paragraph-gap',
  '--article-layout-reading-column-max',
  '--article-layout-table-cell-padding',
] as const

export type ArticleDesignTokenName = (typeof articleDesignTokenNames)[number]
export type ArticleDesignTokens = Record<ArticleDesignTokenName, string>

export type ArticleDesignPreset = {
  description: string
  id: ArticleDesignPresetID
  label: string
  tokens: Partial<ArticleDesignTokens>
}

export type ArticleDesignAdvancedSettings = {
  blockGap?: null | string
  bodyFontSize?: null | string
  bodyLineHeight?: null | string
  captionGap?: null | string
  contentWidth?: null | string
  flowGap?: null | string
  gridGap?: null | string
  paragraphGap?: null | string
}

export type ArticleDesignTypographySettings = {
  cjkFont?: null | string
  codeFont?: null | string
  headingFont?: null | string
  latinFont?: null | string
}

export type ArticleDesignSettingsInput =
  | {
      advanced?: ArticleDesignAdvancedSettings | null
      preset?: null | string
      typography?: ArticleDesignTypographySettings | null
    }
  | null
  | undefined

export type ResolvedArticleDesignConfig = {
  presetID: ArticleDesignPresetID
  style: Partial<Record<ArticleDesignTokenName, string>>
}

export const defaultArticleDesignPresetID: ArticleDesignPresetID = 'compact-editorial'

export type ArticleDesignAdvancedControlName = keyof ArticleDesignAdvancedSettings

export type ArticleDesignAdvancedControlConfig = {
  defaultToken: ArticleDesignTokenName
  description: string
  label: string
  max: number
  min: number
  name: ArticleDesignAdvancedControlName
  step: number
  unit: '' | 'ch' | 'rem'
}

const articleDesignLatinFontStacks = {
  'source-sans-3': 'var(--font-sans-ui, "Source Sans 3"), "Source Sans 3"',
  'system-sans': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI"',
  inter: 'Inter, var(--font-sans-ui, "Source Sans 3")',
  'ibm-plex-sans': '"IBM Plex Sans", var(--font-sans-ui, "Source Sans 3"), "Source Sans 3"',
  newsreader: 'var(--font-serif-display, Newsreader), Newsreader, Georgia',
  georgia: 'Georgia, "Times New Roman"',
} as const

const articleDesignCJKFontStacks = {
  'noto-sans-sc':
    'var(--font-cjk-sans, "Noto Sans SC"), "Noto Sans SC", "Source Han Sans SC", "PingFang SC", sans-serif',
  'source-han-sans-sc':
    '"Source Han Sans SC", var(--font-cjk-sans, "Noto Sans SC"), "Noto Sans SC", "PingFang SC", sans-serif',
  'noto-serif-sc':
    'var(--font-cjk-serif, "Noto Serif SC"), "Noto Serif SC", "Source Han Serif SC", "Songti SC", SimSun, serif',
  'source-han-serif-sc':
    '"Source Han Serif SC", var(--font-cjk-serif, "Noto Serif SC"), "Noto Serif SC", "Songti SC", SimSun, serif',
  'system-cjk-sans': '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  'system-cjk-serif': '"Songti SC", SimSun, "Noto Serif CJK SC", serif',
} as const

const articleDesignHeadingFontStacks = {
  'body-sans': 'var(--article-layout-latin-font-family), var(--article-layout-cjk-font-family)',
  'display-sans':
    'var(--font-sans-ui, "Source Sans 3"), "Source Sans 3", var(--article-layout-cjk-font-family)',
  'editorial-serif':
    'var(--font-serif-display, Newsreader), Newsreader, Georgia, var(--font-cjk-serif, "Noto Serif SC"), "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif',
  'system-serif': 'Georgia, "Times New Roman", var(--article-layout-cjk-font-family), serif',
} as const

const articleDesignCodeFontStacks = {
  'jetbrains-mono':
    'var(--font-code, "JetBrains Mono"), "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  'source-code-pro':
    '"Source Code Pro", var(--font-code, "JetBrains Mono"), "SFMono-Regular", Consolas, monospace',
  'system-mono': '"SFMono-Regular", ui-monospace, Menlo, Consolas, "Liberation Mono", monospace',
  'ui-mono': 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
} as const

type ArticleDesignLatinFontID = keyof typeof articleDesignLatinFontStacks
type ArticleDesignCJKFontID = keyof typeof articleDesignCJKFontStacks
type ArticleDesignHeadingFontID = keyof typeof articleDesignHeadingFontStacks
type ArticleDesignCodeFontID = keyof typeof articleDesignCodeFontStacks

export const articleDesignLatinFontOptions = [
  {
    label: 'Source Sans 3',
    value: 'source-sans-3',
  },
  {
    label: 'System sans',
    value: 'system-sans',
  },
  {
    label: 'Inter',
    value: 'inter',
  },
  {
    label: 'IBM Plex Sans',
    value: 'ibm-plex-sans',
  },
  {
    label: 'Newsreader',
    value: 'newsreader',
  },
  {
    label: 'Georgia',
    value: 'georgia',
  },
] as const

export const articleDesignCJKFontOptions = [
  {
    label: 'Noto Sans SC',
    value: 'noto-sans-sc',
  },
  {
    label: 'Source Han Sans SC',
    value: 'source-han-sans-sc',
  },
  {
    label: 'Noto Serif SC',
    value: 'noto-serif-sc',
  },
  {
    label: 'Source Han Serif SC',
    value: 'source-han-serif-sc',
  },
  {
    label: 'System CJK sans',
    value: 'system-cjk-sans',
  },
  {
    label: 'System CJK serif',
    value: 'system-cjk-serif',
  },
] as const

export const articleDesignHeadingFontOptions = [
  {
    label: 'Editorial serif',
    value: 'editorial-serif',
  },
  {
    label: 'System serif',
    value: 'system-serif',
  },
  {
    label: 'Display sans',
    value: 'display-sans',
  },
  {
    label: 'Body sans',
    value: 'body-sans',
  },
] as const

export const articleDesignCodeFontOptions = [
  {
    label: 'JetBrains Mono',
    value: 'jetbrains-mono',
  },
  {
    label: 'Source Code Pro',
    value: 'source-code-pro',
  },
  {
    label: 'System mono',
    value: 'system-mono',
  },
  {
    label: 'UI mono',
    value: 'ui-mono',
  },
] as const

export const articleDesignAdvancedControlConfigs = [
  {
    defaultToken: '--article-layout-reading-column-max',
    description: 'Controls both the reading column and prose max width.',
    label: 'Content width',
    max: 82,
    min: 58,
    name: 'contentWidth',
    step: 1,
    unit: 'ch',
  },
  {
    defaultToken: '--article-layout-copy-font-size',
    description: 'Body text size in rem.',
    label: 'Body font size',
    max: 1.16,
    min: 0.9,
    name: 'bodyFontSize',
    step: 0.01,
    unit: 'rem',
  },
  {
    defaultToken: '--article-layout-copy-line-height',
    description: 'Unitless body line-height ratio.',
    label: 'Body line height',
    max: 1.86,
    min: 1.45,
    name: 'bodyLineHeight',
    step: 0.01,
    unit: '',
  },
  {
    defaultToken: '--article-layout-paragraph-gap',
    description: 'Vertical gap between consecutive paragraphs.',
    label: 'Paragraph gap',
    max: 1.45,
    min: 0.55,
    name: 'paragraphGap',
    step: 0.01,
    unit: 'rem',
  },
  {
    defaultToken: '--article-layout-flow-gap',
    description: 'Default vertical flow gap between ordinary article elements.',
    label: 'Flow gap',
    max: 1.55,
    min: 0.6,
    name: 'flowGap',
    step: 0.01,
    unit: 'rem',
  },
  {
    defaultToken: '--article-layout-block-gap',
    description: 'Outer vertical gap for figures, tables, code blocks, and callouts.',
    label: 'Rich block gap',
    max: 3,
    min: 1.2,
    name: 'blockGap',
    step: 0.05,
    unit: 'rem',
  },
  {
    defaultToken: '--article-layout-caption-gap',
    description: 'Internal gap between media/table surfaces and their captions.',
    label: 'Caption gap',
    max: 0.85,
    min: 0.2,
    name: 'captionGap',
    step: 0.01,
    unit: 'rem',
  },
  {
    defaultToken: '--article-layout-grid-gap',
    description: 'Desktop gap between the reading column and the table of contents rail.',
    label: 'Reading grid gap',
    max: 4,
    min: 1.25,
    name: 'gridGap',
    step: 0.05,
    unit: 'rem',
  },
] as const satisfies readonly ArticleDesignAdvancedControlConfig[]

const compactEditorialTokens: ArticleDesignTokens = {
  '--article-block-callout-padding': '0.95rem 1rem',
  '--article-block-code-background': '#111318',
  '--article-block-code-border-color': '#2a2f3a',
  '--article-block-inline-code-background': 'color-mix(in oklab, var(--muted) 55%, transparent)',
  '--article-block-inline-code-border-color': 'color-mix(in oklab, var(--border) 80%, transparent)',
  '--article-block-media-surface-background': 'color-mix(in oklab, var(--muted) 32%, transparent)',
  '--article-block-quote-border-color': 'var(--border)',
  '--article-block-quote-padding-left': '1.1rem',
  '--article-block-strong-font-weight': '650',
  '--article-block-table-border-color': 'var(--border)',
  '--article-layout-block-gap': '1.75rem',
  '--article-layout-caption-gap': '0.42rem',
  '--article-layout-cjk-font-family': articleDesignCJKFontStacks['noto-sans-sc'],
  '--article-layout-code-font-family': articleDesignCodeFontStacks['jetbrains-mono'],
  '--article-layout-code-font-size': '0.86rem',
  '--article-layout-code-line-height': '1.58',
  '--article-layout-code-padding': '2.45rem 1rem 1rem',
  '--article-layout-copy-font-size': '1rem',
  '--article-layout-copy-line-height': '1.62',
  '--article-layout-copy-max-width': '70ch',
  '--article-layout-flow-gap': '0.86rem',
  '--article-layout-grid-gap': '2rem',
  '--article-layout-h2-font-size': '1.7rem',
  '--article-layout-h2-line-height': '1.18',
  '--article-layout-h2-margin-bottom': '0.72rem',
  '--article-layout-h2-margin-top': '2.7rem',
  '--article-layout-h3-font-size': '1.34rem',
  '--article-layout-h3-line-height': '1.26',
  '--article-layout-h3-margin-bottom': '0.48rem',
  '--article-layout-h3-margin-top': '1.95rem',
  '--article-layout-h4-font-size': '1.05rem',
  '--article-layout-h4-line-height': '1.34',
  '--article-layout-h4-margin-bottom': '0.32rem',
  '--article-layout-h4-margin-top': '1.35rem',
  '--article-layout-heading-font-family': articleDesignHeadingFontStacks['editorial-serif'],
  '--article-layout-latin-font-family': articleDesignLatinFontStacks['source-sans-3'],
  '--article-layout-list-block-gap': '0.95rem',
  '--article-layout-paragraph-gap': '0.95rem',
  '--article-layout-reading-column-max': '70ch',
  '--article-layout-table-cell-padding': '0.6rem 0.75rem',
}

const balancedEditorialTokens: ArticleDesignTokens = {
  ...compactEditorialTokens,
  '--article-layout-block-gap': '2rem',
  '--article-layout-copy-line-height': '1.7',
  '--article-layout-copy-max-width': '66ch',
  '--article-layout-flow-gap': '1rem',
  '--article-layout-h2-font-size': '1.85rem',
  '--article-layout-h2-margin-top': '3.25rem',
  '--article-layout-h3-font-size': '1.45rem',
  '--article-layout-h3-margin-top': '2.25rem',
  '--article-layout-paragraph-gap': '0.95rem',
  '--article-layout-reading-column-max': '66ch',
}

export const articleDesignPresets: ArticleDesignPreset[] = [
  {
    description: '标题保留衬线气质，正文用非衬线保持密度，代码固定 JetBrains Mono。',
    id: 'compact-editorial',
    label: 'Compact editorial',
    tokens: compactEditorialTokens,
  },
  {
    description: '稍微放松的长文节奏，仍然保留紧凑正文和清晰段落分隔。',
    id: 'balanced-editorial',
    label: 'Balanced editorial',
    tokens: balancedEditorialTokens,
  },
  {
    description: '当前生产文章样式，不注入文章设计系统 token。',
    id: 'current',
    label: 'Current',
    tokens: {},
  },
]

export const articleDesignPresetOptions = articleDesignPresets.map((preset) => ({
  label: `${preset.label} - ${preset.description}`,
  value: preset.id,
}))

const cssLengthPattern = /^\d+(?:\.\d+)?(?:px|rem|em|ch)$/
const lineHeightPattern = /^\d+(?:\.\d+)?$/

function normalizeTokenValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateArticleDesignLength(value: unknown) {
  const normalized = normalizeTokenValue(value)

  if (!normalized || cssLengthPattern.test(normalized)) {
    return true
  }

  return 'Use a positive CSS length with px, rem, em, or ch, such as 70ch or 1.5rem.'
}

export function validateArticleDesignLineHeight(value: unknown) {
  const normalized = normalizeTokenValue(value)

  if (!normalized || lineHeightPattern.test(normalized)) {
    return true
  }

  return 'Use a unitless positive line-height ratio, such as 1.68.'
}

function isArticleDesignPresetID(value: unknown): value is ArticleDesignPresetID {
  return articleDesignPresets.some((preset) => preset.id === value)
}

function getPresetByID(value: unknown) {
  const presetID = isArticleDesignPresetID(value) ? value : defaultArticleDesignPresetID

  return articleDesignPresets.find((preset) => preset.id === presetID) ?? articleDesignPresets[0]
}

export function getArticleDesignAdvancedControlConfig(value: unknown) {
  return articleDesignAdvancedControlConfigs.find((config) => config.name === value) ?? null
}

function trimFormattedNumber(value: string) {
  return value.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

export function formatArticleDesignAdvancedControlValue(
  config: ArticleDesignAdvancedControlConfig,
  value: number,
) {
  const precision = config.step < 0.05 ? 2 : config.step < 1 ? 1 : 0
  const formatted = trimFormattedNumber(value.toFixed(precision))

  return `${formatted}${config.unit}`
}

export function parseArticleDesignAdvancedControlValue(
  config: ArticleDesignAdvancedControlConfig,
  value: unknown,
) {
  const normalized = normalizeTokenValue(value)

  if (!normalized) {
    return null
  }

  const numberPattern =
    config.unit === '' ? /^(\d+(?:\.\d+)?)$/ : new RegExp(`^(\\d+(?:\\.\\d+)?)${config.unit}$`)
  const match = normalized.match(numberPattern)

  if (!match) {
    return null
  }

  const numericValue = Number(match[1])

  if (!Number.isFinite(numericValue)) {
    return null
  }

  return Math.min(config.max, Math.max(config.min, numericValue))
}

export function getArticleDesignAdvancedControlDefaultValue(
  name: ArticleDesignAdvancedControlName,
  presetID: unknown,
) {
  const config = getArticleDesignAdvancedControlConfig(name)

  if (!config) {
    return ''
  }

  const fallbackPreset = getPresetByID(defaultArticleDesignPresetID)
  const preset = getPresetByID(presetID)
  const tokenValue =
    preset.tokens[config.defaultToken] ??
    fallbackPreset.tokens[config.defaultToken] ??
    formatArticleDesignAdvancedControlValue(config, config.min)

  const numericValue = parseArticleDesignAdvancedControlValue(config, tokenValue)

  return numericValue == null
    ? String(tokenValue)
    : formatArticleDesignAdvancedControlValue(config, numericValue)
}

function applyLengthOverride(
  style: Partial<Record<ArticleDesignTokenName, string>>,
  tokenName: ArticleDesignTokenName,
  value: unknown,
) {
  const normalized = normalizeTokenValue(value)

  if (cssLengthPattern.test(normalized)) {
    style[tokenName] = normalized
  }
}

function applyLineHeightOverride(
  style: Partial<Record<ArticleDesignTokenName, string>>,
  tokenName: ArticleDesignTokenName,
  value: unknown,
) {
  const normalized = normalizeTokenValue(value)

  if (lineHeightPattern.test(normalized)) {
    style[tokenName] = normalized
  }
}

function applyFontOverride<TFontID extends string>(
  style: Partial<Record<ArticleDesignTokenName, string>>,
  tokenName: ArticleDesignTokenName,
  stacks: Record<TFontID, string>,
  value: unknown,
) {
  if (typeof value === 'string' && value in stacks) {
    style[tokenName] = stacks[value as TFontID]
  }
}

export function resolveArticleDesignConfig(
  settings: ArticleDesignSettingsInput,
): ResolvedArticleDesignConfig {
  const preset = getPresetByID(settings?.preset)
  const style = { ...preset.tokens }

  if (preset.id === 'current') {
    return {
      presetID: preset.id,
      style: {},
    }
  }

  const advanced = settings?.advanced ?? null

  applyLengthOverride(style, '--article-layout-reading-column-max', advanced?.contentWidth)
  applyLengthOverride(style, '--article-layout-copy-max-width', advanced?.contentWidth)
  applyLengthOverride(style, '--article-layout-copy-font-size', advanced?.bodyFontSize)
  applyLineHeightOverride(style, '--article-layout-copy-line-height', advanced?.bodyLineHeight)
  applyLengthOverride(style, '--article-layout-paragraph-gap', advanced?.paragraphGap)
  applyLengthOverride(style, '--article-layout-flow-gap', advanced?.flowGap)
  applyLengthOverride(style, '--article-layout-block-gap', advanced?.blockGap)
  applyLengthOverride(style, '--article-layout-caption-gap', advanced?.captionGap)
  applyLengthOverride(style, '--article-layout-grid-gap', advanced?.gridGap)

  const typography = settings?.typography ?? null

  applyFontOverride<ArticleDesignLatinFontID>(
    style,
    '--article-layout-latin-font-family',
    articleDesignLatinFontStacks,
    typography?.latinFont,
  )
  applyFontOverride<ArticleDesignCJKFontID>(
    style,
    '--article-layout-cjk-font-family',
    articleDesignCJKFontStacks,
    typography?.cjkFont,
  )
  applyFontOverride<ArticleDesignHeadingFontID>(
    style,
    '--article-layout-heading-font-family',
    articleDesignHeadingFontStacks,
    typography?.headingFont,
  )
  applyFontOverride<ArticleDesignCodeFontID>(
    style,
    '--article-layout-code-font-family',
    articleDesignCodeFontStacks,
    typography?.codeFont,
  )

  return {
    presetID: preset.id,
    style,
  }
}
