export type ArticleLayoutPresetID =
  | 'current'
  | 'dense-technical'
  | 'editorial-balanced'
  | 'prose-baseline'

export const articleLayoutPresetTokenNames = [
  '--article-layout-block-gap',
  '--article-layout-caption-gap',
  '--article-layout-cjk-font-family',
  '--article-layout-code-font-size',
  '--article-layout-code-font-family',
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

export type ArticleLayoutPresetTokenName = (typeof articleLayoutPresetTokenNames)[number]
export type ArticleLayoutPresetTokens = Record<ArticleLayoutPresetTokenName, string>

export type ArticleLayoutPreset = {
  description: string
  id: ArticleLayoutPresetID
  label: string
  tokens: Partial<ArticleLayoutPresetTokens>
}

export type ArticleLayoutAdvancedSettings = {
  blockGap?: null | string
  bodyFontSize?: null | string
  bodyLineHeight?: null | string
  captionGap?: null | string
  contentWidth?: null | string
  flowGap?: null | string
  gridGap?: null | string
  paragraphGap?: null | string
}

export type ArticleLayoutTypographySettings = {
  cjkFont?: null | string
  codeFont?: null | string
  headingFont?: null | string
  latinFont?: null | string
}

export type ArticleLayoutSettingsInput =
  | {
      advanced?: ArticleLayoutAdvancedSettings | null
      preset?: null | string
      typography?: ArticleLayoutTypographySettings | null
    }
  | null
  | undefined

export type ResolvedArticleLayoutConfig = {
  presetID: ArticleLayoutPresetID
  style: Partial<Record<ArticleLayoutPresetTokenName, string>>
}

export const defaultArticleLayoutPresetID: ArticleLayoutPresetID = 'dense-technical'

const articleLayoutLatinFontStacks = {
  'literary-serif': 'Georgia, "Times New Roman", ui-serif, serif',
  'system-sans': 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
  'system-serif': 'var(--font-serif), ui-serif, Georgia, serif',
} as const

const articleLayoutCJKFontStacks = {
  'heiti-sans': '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", sans-serif',
  'kaiti-serif': '"Kaiti SC", KaiTi, STKaiti, serif',
  'songti-serif': '"Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", SimSun, serif',
  'system-cjk-sans': '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
} as const

const articleLayoutHeadingFontStacks = {
  'compact-sans':
    'var(--font-sans), "Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", sans-serif',
  'display-serif': 'var(--font-serif), Georgia, "Source Han Serif SC", "Songti SC", serif',
  inherit: 'var(--article-layout-latin-font-family), var(--article-layout-cjk-font-family), serif',
} as const

const articleLayoutCodeFontStacks = {
  'system-mono': 'var(--font-mono), "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  'technical-mono':
    '"JetBrains Mono", "Fira Code", var(--font-mono), "SFMono-Regular", Consolas, monospace',
} as const

type ArticleLayoutLatinFontID = keyof typeof articleLayoutLatinFontStacks
type ArticleLayoutCJKFontID = keyof typeof articleLayoutCJKFontStacks
type ArticleLayoutHeadingFontID = keyof typeof articleLayoutHeadingFontStacks
type ArticleLayoutCodeFontID = keyof typeof articleLayoutCodeFontStacks

export const articleLayoutLatinFontOptions = [
  {
    label: 'System sans',
    value: 'system-sans',
  },
  {
    label: 'System serif',
    value: 'system-serif',
  },
  {
    label: 'Literary serif',
    value: 'literary-serif',
  },
] as const

export const articleLayoutCJKFontOptions = [
  {
    label: 'System CJK sans',
    value: 'system-cjk-sans',
  },
  {
    label: 'Heiti sans',
    value: 'heiti-sans',
  },
  {
    label: 'Songti serif',
    value: 'songti-serif',
  },
  {
    label: 'Kaiti serif',
    value: 'kaiti-serif',
  },
] as const

export const articleLayoutHeadingFontOptions = [
  {
    label: 'Inherit body stack',
    value: 'inherit',
  },
  {
    label: 'Display serif',
    value: 'display-serif',
  },
  {
    label: 'Compact sans',
    value: 'compact-sans',
  },
] as const

export const articleLayoutCodeFontOptions = [
  {
    label: 'System mono',
    value: 'system-mono',
  },
  {
    label: 'Technical mono',
    value: 'technical-mono',
  },
] as const

export const articleLayoutPresets: ArticleLayoutPreset[] = [
  {
    description: '偏技术笔记的信息密度',
    id: 'dense-technical',
    label: 'Dense',
    tokens: {
      '--article-layout-block-gap': '1.65rem',
      '--article-layout-caption-gap': '0.38rem',
      '--article-layout-cjk-font-family': articleLayoutCJKFontStacks['heiti-sans'],
      '--article-layout-code-font-size': '0.85rem',
      '--article-layout-code-font-family': articleLayoutCodeFontStacks['system-mono'],
      '--article-layout-code-line-height': '1.6',
      '--article-layout-code-padding': '2.25rem 0.95rem 0.95rem',
      '--article-layout-copy-font-size': '0.98rem',
      '--article-layout-copy-line-height': '1.65',
      '--article-layout-copy-max-width': '76ch',
      '--article-layout-flow-gap': '0.95rem',
      '--article-layout-grid-gap': '2rem',
      '--article-layout-h2-font-size': '1.75rem',
      '--article-layout-h2-line-height': '1.22',
      '--article-layout-h2-margin-bottom': '0.75rem',
      '--article-layout-h2-margin-top': '2.75rem',
      '--article-layout-h3-font-size': '1.35rem',
      '--article-layout-h3-line-height': '1.3',
      '--article-layout-h3-margin-bottom': '0.5rem',
      '--article-layout-h3-margin-top': '2rem',
      '--article-layout-h4-font-size': '1.05rem',
      '--article-layout-h4-line-height': '1.38',
      '--article-layout-h4-margin-bottom': '0.35rem',
      '--article-layout-h4-margin-top': '1.5rem',
      '--article-layout-heading-font-family': articleLayoutHeadingFontStacks['compact-sans'],
      '--article-layout-latin-font-family': articleLayoutLatinFontStacks['system-sans'],
      '--article-layout-list-block-gap': '1rem',
      '--article-layout-paragraph-gap': '0.75rem',
      '--article-layout-reading-column-max': '76ch',
      '--article-layout-table-cell-padding': '0.55rem 0.7rem',
    },
  },
  {
    description: '接近成熟 prose 系统的基础节奏',
    id: 'prose-baseline',
    label: 'Prose',
    tokens: {
      '--article-layout-block-gap': '2rem',
      '--article-layout-caption-gap': '0.45rem',
      '--article-layout-cjk-font-family': articleLayoutCJKFontStacks['songti-serif'],
      '--article-layout-code-font-size': '0.875rem',
      '--article-layout-code-font-family': articleLayoutCodeFontStacks['system-mono'],
      '--article-layout-code-line-height': '1.7',
      '--article-layout-code-padding': '2.5rem 1rem 1rem',
      '--article-layout-copy-font-size': '1rem',
      '--article-layout-copy-line-height': '1.75',
      '--article-layout-copy-max-width': '65ch',
      '--article-layout-flow-gap': '1.25em',
      '--article-layout-grid-gap': '2rem',
      '--article-layout-h2-font-size': '1.5em',
      '--article-layout-h2-line-height': '1.333',
      '--article-layout-h2-margin-bottom': '1em',
      '--article-layout-h2-margin-top': '3em',
      '--article-layout-h3-font-size': '1.25em',
      '--article-layout-h3-line-height': '1.45',
      '--article-layout-h3-margin-bottom': '0.6em',
      '--article-layout-h3-margin-top': '2em',
      '--article-layout-h4-font-size': '1.05em',
      '--article-layout-h4-line-height': '1.45',
      '--article-layout-h4-margin-bottom': '0.5em',
      '--article-layout-h4-margin-top': '1.5em',
      '--article-layout-heading-font-family': articleLayoutHeadingFontStacks['inherit'],
      '--article-layout-latin-font-family': articleLayoutLatinFontStacks['system-serif'],
      '--article-layout-list-block-gap': '1.25rem',
      '--article-layout-paragraph-gap': '1rem',
      '--article-layout-reading-column-max': '65ch',
      '--article-layout-table-cell-padding': '0.65rem 0.85rem',
    },
  },
  {
    description: '更贴合当前博客气质的长文节奏',
    id: 'editorial-balanced',
    label: 'Editorial',
    tokens: {
      '--article-layout-block-gap': '2.5rem',
      '--article-layout-caption-gap': '0.5rem',
      '--article-layout-cjk-font-family': articleLayoutCJKFontStacks['songti-serif'],
      '--article-layout-code-font-size': '0.9rem',
      '--article-layout-code-font-family': articleLayoutCodeFontStacks['technical-mono'],
      '--article-layout-code-line-height': '1.7',
      '--article-layout-code-padding': '3rem 1.15rem 1.15rem',
      '--article-layout-copy-font-size': '1.0625rem',
      '--article-layout-copy-line-height': '1.82',
      '--article-layout-copy-max-width': '42rem',
      '--article-layout-flow-gap': '1rem',
      '--article-layout-grid-gap': '2.25rem',
      '--article-layout-h2-font-size': 'clamp(2rem, 4vw, 2.5rem)',
      '--article-layout-h2-line-height': '1.12',
      '--article-layout-h2-margin-bottom': '1.15rem',
      '--article-layout-h2-margin-top': '4.5rem',
      '--article-layout-h3-font-size': 'clamp(1.45rem, 3vw, 1.8rem)',
      '--article-layout-h3-line-height': '1.24',
      '--article-layout-h3-margin-bottom': '0.85rem',
      '--article-layout-h3-margin-top': '3rem',
      '--article-layout-h4-font-size': '1.18rem',
      '--article-layout-h4-line-height': '1.45',
      '--article-layout-h4-margin-bottom': '0.55rem',
      '--article-layout-h4-margin-top': '2.1rem',
      '--article-layout-heading-font-family': articleLayoutHeadingFontStacks['display-serif'],
      '--article-layout-latin-font-family': articleLayoutLatinFontStacks['literary-serif'],
      '--article-layout-list-block-gap': '1.25rem',
      '--article-layout-paragraph-gap': '0.85rem',
      '--article-layout-reading-column-max': '42rem',
      '--article-layout-table-cell-padding': '0.75rem 1rem',
    },
  },
  {
    description: '当前生产文章样式',
    id: 'current',
    label: 'Current',
    tokens: {},
  },
]

export const articleLayoutPresetOptions = articleLayoutPresets.map((preset) => ({
  label: `${preset.label} - ${preset.description}`,
  value: preset.id,
}))

const cssLengthPattern = /^\d+(?:\.\d+)?(?:px|rem|em|ch)$/
const lineHeightPattern = /^\d+(?:\.\d+)?$/

function normalizeTokenValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateArticleLayoutLength(value: unknown) {
  const normalized = normalizeTokenValue(value)

  if (!normalized || cssLengthPattern.test(normalized)) {
    return true
  }

  return 'Use a positive CSS length with px, rem, em, or ch, such as 70ch or 1.5rem.'
}

export function validateArticleLayoutLineHeight(value: unknown) {
  const normalized = normalizeTokenValue(value)

  if (!normalized || lineHeightPattern.test(normalized)) {
    return true
  }

  return 'Use a unitless positive line-height ratio, such as 1.68.'
}

function isArticleLayoutPresetID(value: unknown): value is ArticleLayoutPresetID {
  return articleLayoutPresets.some((preset) => preset.id === value)
}

function getPresetByID(value: unknown) {
  const presetID = isArticleLayoutPresetID(value) ? value : defaultArticleLayoutPresetID

  return articleLayoutPresets.find((preset) => preset.id === presetID) ?? articleLayoutPresets[0]
}

function applyLengthOverride(
  style: Partial<Record<ArticleLayoutPresetTokenName, string>>,
  tokenName: ArticleLayoutPresetTokenName,
  value: unknown,
) {
  const normalized = normalizeTokenValue(value)

  if (cssLengthPattern.test(normalized)) {
    style[tokenName] = normalized
  }
}

function applyLineHeightOverride(
  style: Partial<Record<ArticleLayoutPresetTokenName, string>>,
  tokenName: ArticleLayoutPresetTokenName,
  value: unknown,
) {
  const normalized = normalizeTokenValue(value)

  if (lineHeightPattern.test(normalized)) {
    style[tokenName] = normalized
  }
}

function applyFontOverride<TFontID extends string>(
  style: Partial<Record<ArticleLayoutPresetTokenName, string>>,
  tokenName: ArticleLayoutPresetTokenName,
  stacks: Record<TFontID, string>,
  value: unknown,
) {
  if (typeof value === 'string' && value in stacks) {
    style[tokenName] = stacks[value as TFontID]
  }
}

export function resolveArticleLayoutConfig(
  settings: ArticleLayoutSettingsInput,
): ResolvedArticleLayoutConfig {
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

  applyFontOverride<ArticleLayoutLatinFontID>(
    style,
    '--article-layout-latin-font-family',
    articleLayoutLatinFontStacks,
    typography?.latinFont,
  )
  applyFontOverride<ArticleLayoutCJKFontID>(
    style,
    '--article-layout-cjk-font-family',
    articleLayoutCJKFontStacks,
    typography?.cjkFont,
  )
  applyFontOverride<ArticleLayoutHeadingFontID>(
    style,
    '--article-layout-heading-font-family',
    articleLayoutHeadingFontStacks,
    typography?.headingFont,
  )
  applyFontOverride<ArticleLayoutCodeFontID>(
    style,
    '--article-layout-code-font-family',
    articleLayoutCodeFontStacks,
    typography?.codeFont,
  )

  return {
    presetID: preset.id,
    style,
  }
}
