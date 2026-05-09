'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  TypefaceCandidateID,
  TypefaceCandidateScheme,
  TypefaceCodeSampleID,
  TypefaceFontOption,
  TypefaceFontRole,
  TypefaceHighlightedCodeSamples,
  TypefaceLabSettings,
} from '@/lib/dev-typefaces'
import { typefaceCodeSamples } from '@/lib/dev-typefaces'

type TypefaceLabClientProps = {
  criteria: readonly string[]
  fontOptions: Record<TypefaceFontRole, TypefaceFontOption[]>
  highlightedCodeSamples: TypefaceHighlightedCodeSamples
  schemes: TypefaceCandidateScheme[]
}

type ActivePresetID = 'custom' | TypefaceCandidateID

type TypefacePreviewStyle = CSSProperties &
  Record<
    | '--typeface-body-font'
    | '--typeface-body-line-height'
    | '--typeface-body-size'
    | '--typeface-body-weight'
    | '--typeface-code-font'
    | '--typeface-code-size'
    | '--typeface-display-font'
    | '--typeface-display-size'
    | '--typeface-display-weight'
    | '--typeface-heading-font'
    | '--typeface-heading-size'
    | '--typeface-heading-weight'
    | '--typeface-strong-weight',
    number | string
  >

const defaultPresetID: TypefaceCandidateID = 'hybrid-magazine'

function findFontOption(options: TypefaceFontOption[], value: string) {
  return options.find((option) => option.id === value) ?? options[0]
}

function formatRem(value: number) {
  return `${value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}rem`
}

function buildPreviewStyle(props: {
  cjkFont: TypefaceFontOption
  codeFont: TypefaceFontOption
  latinFont: TypefaceFontOption
  settings: TypefaceLabSettings
}): TypefacePreviewStyle {
  const bodyFont = `${props.latinFont.stack}, ${props.cjkFont.stack}`
  const headingFont = `${props.latinFont.stack}, ${props.cjkFont.stack}`

  return {
    '--typeface-body-font': bodyFont,
    '--typeface-body-line-height': props.settings.bodyLineHeight,
    '--typeface-body-size': formatRem(props.settings.bodySize),
    '--typeface-body-weight': props.settings.bodyWeight,
    '--typeface-code-font': props.codeFont.stack,
    '--typeface-code-size': formatRem(props.settings.codeSize),
    '--typeface-display-font': headingFont,
    '--typeface-display-size': formatRem(props.settings.displaySize),
    '--typeface-display-weight': props.settings.displayWeight,
    '--typeface-heading-font': headingFont,
    '--typeface-heading-size': formatRem(props.settings.headingSize),
    '--typeface-heading-weight': props.settings.headingWeight,
    '--typeface-strong-weight': props.settings.strongWeight,
  }
}

function NumberControl(props: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step: number
  suffix?: string
  value: number
}) {
  return (
    <label className="dev-typeface-control">
      <span className="dev-typeface-control__header">
        <span>{props.label}</span>
        <output>
          {props.value}
          {props.suffix ?? ''}
        </output>
      </span>
      <input
        max={props.max}
        min={props.min}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
        step={props.step}
        type="range"
        value={props.value}
      />
    </label>
  )
}

function FontSelect(props: {
  label: string
  onChange: (value: string) => void
  options: TypefaceFontOption[]
  value: string
}) {
  const selected = findFontOption(props.options, props.value)

  return (
    <label className="dev-typeface-control">
      <span className="dev-typeface-control__header">
        <span>{props.label}</span>
        <span>{selected.license}</span>
      </span>
      <select
        aria-label={props.label}
        onChange={(event) => props.onChange(event.currentTarget.value)}
        value={props.value}
      >
        {props.options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="dev-typeface-control__note">{selected.tone}</span>
    </label>
  )
}

export function TypefaceLabClient(props: TypefaceLabClientProps) {
  const initialPreset =
    props.schemes.find((scheme) => scheme.id === defaultPresetID) ?? props.schemes[0]
  const [activePreset, setActivePreset] = useState<ActivePresetID>(initialPreset.id)
  const [settings, setSettings] = useState<TypefaceLabSettings>(initialPreset.settings)
  const activeCodeSample =
    typefaceCodeSamples.find((sample) => sample.id === settings.codeLanguage) ??
    typefaceCodeSamples[0]
  const highlightedCodeSample = props.highlightedCodeSamples[activeCodeSample.id]
  const cjkFont = findFontOption(props.fontOptions.cjk, settings.cjkFont)
  const latinFont = findFontOption(props.fontOptions.latin, settings.latinFont)
  const codeFont = findFontOption(props.fontOptions.code, settings.codeFont)
  const previewStyle = useMemo(
    () => buildPreviewStyle({ cjkFont, codeFont, latinFont, settings }),
    [cjkFont, codeFont, latinFont, settings],
  )

  function updateSetting<TKey extends keyof TypefaceLabSettings>(
    key: TKey,
    value: TypefaceLabSettings[TKey],
  ) {
    setActivePreset('custom')
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function applyPreset(scheme: TypefaceCandidateScheme) {
    setActivePreset(scheme.id)
    setSettings(scheme.settings)
  }

  return (
    <section className="dev-typeface-lab">
      <div
        className="dev-typeface-lab__preview"
        data-active-preset={activePreset}
        data-testid="typeface-main-preview"
        style={previewStyle}
      >
        <div className="dev-typeface-preview">
          <header className="dev-typeface-preview__header">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activePreset === 'custom' ? 'Custom' : 'Preset'}</Badge>
              <Badge variant="secondary">{cjkFont.label}</Badge>
              <Badge variant="secondary">{latinFont.label}</Badge>
              <Badge variant="secondary">{codeFont.label}</Badge>
            </div>
            <p className="dev-typeface-preview__meta">Typeface Preview / 2026.05</p>
            <h2>字体系统应该让重点自然浮出来，而不是每个字都在喊。</h2>
            <p className="dev-typeface-preview__dek">
              A measured interface should keep dense information legible while allowing headings,
              citations, code, and metadata to sit in different visual layers.
            </p>
          </header>

          <div className="dev-typeface-preview__stack">
            <section className="dev-typeface-preview__article">
              <p className="dev-typeface-preview__label">Title Sample</p>
              <h3>文章在时间里展开，字体也应当留下停顿。</h3>
              <p>
                当一个段落同时包含中文叙述、English terms 和少量技术词汇时，正文需要足够安静。
                <strong>真正重要的信息</strong>{' '}
                应该通过字重、位置和留白被读者识别，而不是依靠过大的字号。
              </p>
              <p>
                Inline code like <code>font-weight</code> and <code>line-height</code> should remain
                compact, clear, and visibly separate from prose.
              </p>
              <blockquote>
                元信息、标签和说明文字不应该和正文抢层级；它们只需要刚好能被看见。
              </blockquote>
            </section>

            <section className="dev-typeface-preview__code">
              <div className="dev-typeface-preview__code-header">
                <p className="dev-typeface-preview__label">Code Sample</p>
                <span>{activeCodeSample.label}</span>
              </div>
              <pre
                className="markdown-codeblock dev-typeface-codeblock"
                data-language={activeCodeSample.id}
                data-testid="typeface-codeblock"
              >
                <span className="markdown-codeblock__label">{activeCodeSample.label}</span>
                <code
                  className="markdown-codeblock__code markdown-codeblock__code--highlighted"
                  data-highlight-language={highlightedCodeSample.language ?? undefined}
                  data-highlighted={highlightedCodeSample.highlighted ? 'true' : undefined}
                  dangerouslySetInnerHTML={{ __html: highlightedCodeSample.html }}
                />
              </pre>
            </section>
          </div>
        </div>
      </div>

      <aside aria-label="字体配置" className="dev-typeface-lab__controls">
        <div className="dev-typeface-lab__controls-header">
          <SlidersHorizontal aria-hidden="true" />
          <div>
            <p className="section-kicker">Controls</p>
            <h2>字体配置</h2>
          </div>
        </div>

        <section className="dev-typeface-control-group">
          <p className="dev-typeface-control-group__title">Preset</p>
          <div className="dev-typeface-preset-list">
            {props.schemes.map((scheme) => (
              <Button
                aria-pressed={activePreset === scheme.id}
                key={scheme.id}
                onClick={() => applyPreset(scheme)}
                type="button"
                variant={activePreset === scheme.id ? 'default' : 'outline'}
              >
                {activePreset === scheme.id ? (
                  <Check aria-hidden="true" data-icon="inline-start" />
                ) : null}
                {scheme.title}
              </Button>
            ))}
          </div>
        </section>

        <section className="dev-typeface-control-group">
          <p className="dev-typeface-control-group__title">Fonts</p>
          <FontSelect
            label="中文字体"
            onChange={(value) => updateSetting('cjkFont', value)}
            options={props.fontOptions.cjk}
            value={settings.cjkFont}
          />
          <FontSelect
            label="西文字体"
            onChange={(value) => updateSetting('latinFont', value)}
            options={props.fontOptions.latin}
            value={settings.latinFont}
          />
          <FontSelect
            label="代码字体"
            onChange={(value) => updateSetting('codeFont', value)}
            options={props.fontOptions.code}
            value={settings.codeFont}
          />
        </section>

        <section className="dev-typeface-control-group">
          <p className="dev-typeface-control-group__title">Code</p>
          <label className="dev-typeface-control">
            <span className="dev-typeface-control__header">
              <span>代码语言</span>
              <span>{activeCodeSample.label}</span>
            </span>
            <select
              aria-label="代码语言"
              onChange={(event) =>
                updateSetting('codeLanguage', event.currentTarget.value as TypefaceCodeSampleID)
              }
              value={settings.codeLanguage}
            >
              {typefaceCodeSamples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.label}
                </option>
              ))}
            </select>
          </label>
          <NumberControl
            label="代码字号"
            max={1}
            min={0.75}
            onChange={(value) => updateSetting('codeSize', value)}
            step={0.01}
            suffix="rem"
            value={settings.codeSize}
          />
        </section>

        <section className="dev-typeface-control-group">
          <p className="dev-typeface-control-group__title">Scale</p>
          <NumberControl
            label="正文字号"
            max={1.12}
            min={0.92}
            onChange={(value) => updateSetting('bodySize', value)}
            step={0.01}
            suffix="rem"
            value={settings.bodySize}
          />
          <NumberControl
            label="正文行高"
            max={1.95}
            min={1.55}
            onChange={(value) => updateSetting('bodyLineHeight', value)}
            step={0.01}
            value={settings.bodyLineHeight}
          />
          <NumberControl
            label="标题字号"
            max={4.5}
            min={3.2}
            onChange={(value) => updateSetting('displaySize', value)}
            step={0.05}
            suffix="rem"
            value={settings.displaySize}
          />
          <NumberControl
            label="强调字重"
            max={700}
            min={500}
            onChange={(value) => updateSetting('strongWeight', value)}
            step={100}
            value={settings.strongWeight}
          />
        </section>

        <section className="dev-typeface-control-group">
          <p className="dev-typeface-control-group__title">Checks</p>
          <ul className="dev-typeface-check-list">
            {props.criteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </section>
      </aside>
    </section>
  )
}
