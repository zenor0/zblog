'use client'

import type { UIFieldClientComponent } from 'payload'
import type { CSSProperties } from 'react'

import { useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'

import {
  articleLayoutPresets,
  resolveArticleLayoutConfig,
  type ArticleLayoutAdvancedSettings,
  type ArticleLayoutSettingsInput,
  type ArticleLayoutTypographySettings,
} from '@/lib/article-layout'

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
] as const satisfies ReadonlyArray<keyof ArticleLayoutAdvancedSettings>

const typographyOverrideKeys = [
  'cjkFont',
  'codeFont',
  'headingFont',
  'latinFont',
] as const satisfies ReadonlyArray<keyof ArticleLayoutTypographySettings>

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
): ArticleLayoutAdvancedSettings {
  return advancedOverrideKeys.reduce<ArticleLayoutAdvancedSettings>((settings, key) => {
    settings[key] = getStringValue(value[key])

    return settings
  }, {})
}

function readTypographySettingsFromRecord(
  value: Record<string, unknown>,
): ArticleLayoutTypographySettings {
  return typographyOverrideKeys.reduce<ArticleLayoutTypographySettings>((settings, key) => {
    settings[key] = getStringValue(value[key])

    return settings
  }, {})
}

function readArticleLayoutSettings(
  fields: ArticleLayoutFormState | undefined,
): ArticleLayoutSettingsInput {
  const groupValue = fields?.articleLayout?.value

  if (isRecord(groupValue)) {
    return {
      advanced: isRecord(groupValue.advanced)
        ? readAdvancedSettingsFromRecord(groupValue.advanced)
        : undefined,
      preset: getStringValue(groupValue.preset),
      typography: isRecord(groupValue.typography)
        ? readTypographySettingsFromRecord(groupValue.typography)
        : undefined,
    }
  }

  return {
    advanced: advancedOverrideKeys.reduce<ArticleLayoutAdvancedSettings>((settings, key) => {
      settings[key] = getFieldStringValue(fields, `articleLayout.advanced.${key}`)

      return settings
    }, {}),
    preset: getFieldStringValue(fields, 'articleLayout.preset'),
    typography: typographyOverrideKeys.reduce<ArticleLayoutTypographySettings>((settings, key) => {
      settings[key] = getFieldStringValue(fields, `articleLayout.typography.${key}`)

      return settings
    }, {}),
  }
}

export const ArticleLayoutPreview: UIFieldClientComponent = () => {
  const fields = useFormFields(([formFields]) => formFields as ArticleLayoutFormState)
  const settings = useMemo(() => readArticleLayoutSettings(fields), [fields])
  const resolved = useMemo(() => resolveArticleLayoutConfig(settings), [settings])
  const preset = articleLayoutPresets.find((item) => item.id === resolved.presetID)

  return (
    <section
      className="article-layout-preview"
      data-article-layout-preset={resolved.presetID}
      data-testid="article-layout-preview"
      style={resolved.style as CSSProperties}
    >
      <div className="article-layout-preview__header">
        <span>Live article layout preview</span>
        <strong>{preset?.label ?? resolved.presetID}</strong>
      </div>

      <div className="article-layout-preview__surface">
        <article className="article-layout-preview__copy">
          <h2>Reading rhythm / 阅读节奏</h2>
          <p>
            A dense article layout should keep paragraphs close enough for scanning while still
            leaving clear breaks around richer blocks.
          </p>
          <p>
            这段中文会跟随 CJK 字体栈，English words follow the Latin stack, so mixed-language
            reading can be judged without leaving the admin page.
          </p>

          <figure className="article-layout-preview__figure">
            <div className="article-layout-preview__media" />
            <figcaption>Captions sit close to images so the pair reads as one unit.</figcaption>
          </figure>

          <pre className="article-layout-preview__code">
            <code>{`const layout = resolveArticleLayoutConfig(settings)`}</code>
          </pre>

          <figure className="article-layout-preview__table-figure">
            <div className="article-layout-preview__table-scroll">
              <table>
                <tbody>
                  <tr>
                    <th>Element</th>
                    <th>Token</th>
                  </tr>
                  <tr>
                    <td>Paragraph</td>
                    <td>paragraph gap</td>
                  </tr>
                  <tr>
                    <td>Caption</td>
                    <td>caption gap</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <figcaption>Table notes follow the table with the configured caption gap.</figcaption>
          </figure>
        </article>
      </div>
    </section>
  )
}
