'use client'

import type { UIFieldClientComponent } from 'payload'
import type { CSSProperties } from 'react'

import { useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'

import {
  resolveArticleDesignConfig,
  type ArticleDesignAdvancedSettings,
  type ArticleDesignSettingsInput,
  type ArticleDesignTypographySettings,
} from '@/features/article/model/article-design'
import { MarkdownRenderer } from '@/features/article/markdown'

import '@/styles/frontend/article-block-surfaces.css'
import './article-layout-preview.scss'

type FormFieldState = {
  value?: unknown
}

type ArticleLayoutFormState = Record<string, FormFieldState | undefined>

const advancedOverrideKeys = [
  'blockGap',
  'bodyFontSize',
  'bodyLineHeight',
  'captionGap',
  'contentWidth',
  'flowGap',
  'gridGap',
  'paragraphGap',
] as const satisfies ReadonlyArray<keyof ArticleDesignAdvancedSettings>

const typographyOverrideKeys = [
  'cjkFont',
  'codeFont',
  'headingFont',
  'latinFont',
] as const satisfies ReadonlyArray<keyof ArticleDesignTypographySettings>

const articleDesignPreviewMarkdown = `## 字体系统应该让重点自然浮出来，而不是每个字都在喊。

正文使用非衬线字体保持信息密度，English terms stay calm in the same rhythm. **真正重要的信息** 通过字重和位置被读者识别，而不是依靠夸张字号。

段内行距保持紧凑，段落之间留出更明确的停顿，代码、引用、表格和提示块则通过统一 block tokens 接入同一套视觉系统。

> 元信息、标签和说明文字不应该和正文抢层级；它们只需要刚好能被看见。

> [!NOTE]
> Callout blocks share the same spacing rhythm.

\`\`\`ts
const design = resolveArticleDesignConfig(settings)
\`\`\`

| Token | What it changes |
| --- | --- |
| Copy width | Reading comfort |
| Block gap | Code, figures, tables |
`

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function getFieldStringValue(fields: ArticleLayoutFormState | undefined, path: string) {
  return getStringValue(fields?.[path]?.value)
}

function readAdvancedSettingsFromRecord(
  value: Record<string, unknown>,
): ArticleDesignAdvancedSettings {
  return advancedOverrideKeys.reduce<ArticleDesignAdvancedSettings>((settings, key) => {
    settings[key] = getStringValue(value[key])

    return settings
  }, {})
}

function readTypographySettingsFromRecord(
  value: Record<string, unknown>,
): ArticleDesignTypographySettings {
  return typographyOverrideKeys.reduce<ArticleDesignTypographySettings>((settings, key) => {
    settings[key] = getStringValue(value[key])

    return settings
  }, {})
}

function readArticleLayoutSettings(
  fields: ArticleLayoutFormState | undefined,
): ArticleDesignSettingsInput {
  const groupValue = fields?.articleLayout?.value
  const groupSettings = isRecord(groupValue)
    ? {
        advanced: isRecord(groupValue.advanced)
          ? readAdvancedSettingsFromRecord(groupValue.advanced)
          : {},
        preset: getStringValue(groupValue.preset),
        typography: isRecord(groupValue.typography)
          ? readTypographySettingsFromRecord(groupValue.typography)
          : {},
      }
    : {
        advanced: {},
        preset: undefined,
        typography: {},
      }

  return {
    advanced: advancedOverrideKeys.reduce<ArticleDesignAdvancedSettings>((settings, key) => {
      settings[key] =
        getFieldStringValue(fields, `articleLayout.advanced.${key}`) ?? groupSettings.advanced[key]

      return settings
    }, {}),
    preset: getFieldStringValue(fields, 'articleLayout.preset') ?? groupSettings.preset,
    typography: typographyOverrideKeys.reduce<ArticleDesignTypographySettings>((settings, key) => {
      settings[key] =
        getFieldStringValue(fields, `articleLayout.typography.${key}`) ??
        groupSettings.typography[key]

      return settings
    }, {}),
  }
}

export const ArticleLayoutPreview: UIFieldClientComponent = () => {
  const fields = useFormFields(([formFields]) => formFields as ArticleLayoutFormState)
  const settings = useMemo(() => readArticleLayoutSettings(fields), [fields])
  const resolved = useMemo(() => resolveArticleDesignConfig(settings), [settings])

  return (
    <section
      className="article-design-preview article-layout-preview"
      data-article-design-preset={resolved.presetID}
      data-article-layout-preset={resolved.presetID}
      data-testid="article-design-preview"
      style={resolved.style as CSSProperties}
    >
      <div className="article-design-preview__header article-layout-preview__header">
        <span>Article design preview</span>
      </div>

      <div className="article-design-preview__surface article-layout-preview__surface">
        <article className="article-design-preview__article" data-article-layout="">
          <div className="article-design-preview__reading-column" data-article-reading-column="">
            <header className="article-design-preview__frontmatter" data-article-frontmatter="">
              <p className="section-kicker">Published</p>
              <h1>文章页面的视觉设置应该在后台直接看到结果</h1>
              <p>
                This preview uses the production Markdown renderer, so headings, callouts, code,
                tables, and links follow the same component path as public article pages.
              </p>
            </header>

            <div
              className="article-copy article-design-preview__copy"
              data-testid="article-design-preview-copy"
            >
              <MarkdownRenderer source={articleDesignPreviewMarkdown} />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
