'use client'

import type { UIFieldClientComponent } from 'payload'
import type { CSSProperties } from 'react'

import { useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'

import {
  articleDesignPresets,
  resolveArticleDesignConfig,
  type ArticleDesignAdvancedSettings,
  type ArticleDesignSettingsInput,
  type ArticleDesignTypographySettings,
} from '@/lib/article-design'

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
  const preset = articleDesignPresets.find((item) => item.id === resolved.presetID)

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
        <strong>{preset?.label ?? resolved.presetID}</strong>
      </div>

      <div className="article-design-preview__surface article-layout-preview__surface">
        <article className="article-design-preview__copy article-layout-preview__copy">
          <div className="article-design-preview__meta">Preview / Article design system</div>
          <h2>字体系统应该让重点自然浮出来，而不是每个字都在喊。</h2>
          <p>
            正文使用非衬线字体保持信息密度，English terms stay calm in the same rhythm.
            <strong>真正重要的信息</strong> 通过字重和位置被读者识别，而不是依靠夸张字号。
          </p>
          <p>
            段内行距保持紧凑，段落之间留出更明确的停顿，代码、引用、表格和提示块则通过统一
            block tokens 接入同一套视觉系统。
          </p>

          <blockquote data-article-block="blockquote">
            元信息、标签和说明文字不应该和正文抢层级；它们只需要刚好能被看见。
          </blockquote>

          <aside className="md-callout md-callout--note" data-article-block="callout">
            <div className="md-callout__title">Note</div>
            <div className="md-callout__content">Callout blocks share the same spacing rhythm.</div>
          </aside>

          <pre
            className="article-design-preview__code article-layout-preview__code"
            data-article-block="code-block"
            data-testid="article-design-preview-codeblock"
          >
            <code>{`const design = resolveArticleDesignConfig(settings)`}</code>
          </pre>

          <figure
            className="article-design-preview__figure article-layout-preview__figure"
            data-article-block="figure"
          >
            <div className="article-design-preview__media article-layout-preview__media" />
            <figcaption>Captions sit close to images so the pair reads as one unit.</figcaption>
          </figure>
        </article>

        <aside aria-label="Article design summary" className="article-design-preview__summary">
          <span>Typography</span>
          <strong>Serif headings / sans body / JetBrains code</strong>
          <span>Rhythm</span>
          <strong>Compact lines with clearer paragraph breaks</strong>
          <span>Blocks</span>
          <strong>Registry-driven article block tokens</strong>
        </aside>
      </div>
    </section>
  )
}
