'use client'

import type { UIFieldClientComponent } from 'payload'

import { CodeEditor, useField, useFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  buildSiteVariableContext,
  getSiteSettingsSectionRootKeys,
  mergeSiteSettingsSection,
  parseSiteSettingsSectionYAML,
  serializeSiteSettingsSectionToYAML,
  siteSettingsSectionLabels,
  validateSiteSettingReferences,
  type SiteSettingsSectionID,
} from '@/features/site-settings/model/site-settings-config'
import {
  readSiteSettingsSnapshot,
  type SiteSettingsFormState,
} from '@/features/site-settings/admin/site-settings-form-state'

import './site-settings-raw-section-editor.scss'

type FieldSetter = {
  setValue: (value: unknown) => void
}
type CompletionProviderDisposable = {
  dispose?: () => void
}
type MonacoLike = {
  languages?: {
    CompletionItemInsertTextRule?: Record<string, number>
    CompletionItemKind?: Record<string, number>
    registerCompletionItemProvider?: (
      languageID: string,
      provider: {
        provideCompletionItems: () => {
          suggestions: {
            detail: string
            insertText: string
            insertTextRules?: number
            kind?: number
            label: string
          }[]
        }
        triggerCharacters?: string[]
      },
    ) => CompletionProviderDisposable
  }
}

const rawFieldSectionMap: Record<string, SiteSettingsSectionID> = {
  articleLayoutRawConfig: 'articleLayout',
  footerRawConfig: 'footer',
  generalRawConfig: 'general',
  homepageRawConfig: 'homepage',
  seoRawConfig: 'seo',
}

function getSectionFromFieldName(fieldName: unknown, path: string): SiteSettingsSectionID {
  if (typeof fieldName === 'string' && rawFieldSectionMap[fieldName]) {
    return rawFieldSectionMap[fieldName]
  }

  return rawFieldSectionMap[path] ?? 'general'
}

function formatValidationError(references: string[]) {
  return `Unknown site setting reference: ${references.join(', ')}.`
}

export const SiteSettingsRawSectionEditor: UIFieldClientComponent = ({ field, path }) => {
  const fields = useFormFields(([formFields]) => formFields as SiteSettingsFormState)
  const section = getSectionFromFieldName(field.name, path)
  const label = siteSettingsSectionLabels[section]
  const settings = useMemo(() => readSiteSettingsSnapshot(fields), [fields])
  const serialized = useMemo(
    () => serializeSiteSettingsSectionToYAML(section, settings),
    [section, settings],
  )
  const [draft, setDraft] = useState(serialized)
  const [error, setError] = useState<null | string>(null)
  const [notice, setNotice] = useState<null | string>(null)
  const [isDirty, setIsDirty] = useState(false)
  const completionProviderRef = useRef<CompletionProviderDisposable | null>(null)
  const siteName = useField<unknown>({ path: 'siteName' })
  const siteDescription = useField<unknown>({ path: 'siteDescription' })
  const globalVariables = useField<unknown>({ path: 'globalVariables' })
  const appearance = useField<unknown>({ path: 'appearance' })
  const homeHero = useField<unknown>({ path: 'homeHero' })
  const seo = useField<unknown>({ path: 'seo' })
  const articleLayout = useField<unknown>({ path: 'articleLayout' })
  const footer = useField<unknown>({ path: 'footer' })
  const setters: Record<string, FieldSetter> = {
    appearance,
    articleLayout,
    footer,
    globalVariables,
    homeHero,
    seo,
    siteDescription,
    siteName,
  }

  useEffect(() => {
    if (!isDirty) {
      setDraft(serialized)
    }
  }, [isDirty, serialized])

  useEffect(() => {
    return () => {
      completionProviderRef.current?.dispose?.()
      completionProviderRef.current = null
    }
  }, [])

  function handleEditorMount(_editor: unknown, monaco: MonacoLike) {
    completionProviderRef.current?.dispose?.()

    const registerCompletionItemProvider = monaco.languages?.registerCompletionItemProvider

    if (!registerCompletionItemProvider) {
      return
    }

    completionProviderRef.current = registerCompletionItemProvider('yaml', {
      triggerCharacters: ['{', '.'],
      provideCompletionItems: () => {
        const variablePaths = Object.keys(buildSiteVariableContext(settings)).sort()
        const variableKind = monaco.languages?.CompletionItemKind?.Variable
        const insertAsSnippet = monaco.languages?.CompletionItemInsertTextRule?.InsertAsSnippet

        return {
          suggestions: variablePaths.map((variablePath) => ({
            detail: 'Site setting variable',
            insertText: `{{${variablePath}}}`,
            insertTextRules: insertAsSnippet,
            kind: variableKind,
            label: `{{${variablePath}}}`,
          })),
        }
      },
    })
  }

  function applyYAML() {
    try {
      const parsed = parseSiteSettingsSectionYAML(section, draft)
      const nextSettings = mergeSiteSettingsSection(settings, section, parsed)
      const validation = validateSiteSettingReferences(nextSettings)

      if (!validation.valid) {
        throw new Error(formatValidationError(validation.unknownReferences))
      }

      getSiteSettingsSectionRootKeys(section).forEach((rootKey) => {
        if (Object.prototype.hasOwnProperty.call(parsed, rootKey)) {
          setters[rootKey]?.setValue((parsed as Record<string, unknown>)[rootKey])
        }
      })

      setError(null)
      setNotice(`${label} YAML applied to the form.`)
      setIsDirty(false)
    } catch (caughtError) {
      setNotice(null)
      setError(caughtError instanceof Error ? caughtError.message : 'Could not apply YAML.')
    }
  }

  function resetDraft() {
    setDraft(serialized)
    setError(null)
    setNotice(null)
    setIsDirty(false)
  }

  return (
    <section
      className="site-settings-raw-editor"
      data-site-settings-raw-editor={section}
      data-testid={`site-settings-raw-editor-${section}`}
    >
      <div className="site-settings-raw-editor__yaml-panel">
        <CodeEditor
          defaultLanguage="yaml"
          maxHeight={640}
          minHeight={320}
          onChange={(value) => {
            setDraft(value ?? '')
            setIsDirty(true)
            setError(null)
            setNotice(null)
          }}
          onMount={handleEditorMount}
          options={{
            minimap: {
              enabled: false,
            },
            padding: {
              bottom: 12,
              top: 12,
            },
            quickSuggestions: {
              comments: false,
              other: true,
              strings: true,
            },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
          value={draft}
          wrapperProps={{
            'aria-label': `${label} YAML config`,
          }}
        />

        <div className="site-settings-raw-editor__actions">
          <button onClick={applyYAML} type="button">
            Apply YAML
          </button>
          <button disabled={!isDirty} onClick={resetDraft} type="button">
            Reload from form
          </button>
        </div>

        {error ? <p className="site-settings-raw-editor__error">{error}</p> : null}
        {notice ? <p className="site-settings-raw-editor__notice">{notice}</p> : null}
      </div>
    </section>
  )
}
