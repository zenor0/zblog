'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { supportedLocales, type AppLocale } from '@/shared/i18n/locales'

import './post-package-import-action.scss'

type ImportMode = 'mdship' | 'zip'
type LocaleSelection = '' | AppLocale
type WorkspaceSelection = null | {
  fileCount: number
  rootName: string
}

type ImportResponse = {
  message?: string
  result?: {
    importedLocales: string[]
    importedMediaCount: number
    operation: 'created' | 'updated'
    postID: number
    slug: string
    sourceKind: 'generic' | 'mdship'
    warnings: string[]
  }
}

type PostPackageImportPanelProps = {
  onComplete?: () => void
}

function getWorkspaceSelection(files: FileList | null): WorkspaceSelection {
  if (!files || files.length === 0) {
    return null
  }

  const rootName =
    ((files[0] as File & { webkitRelativePath?: string }).webkitRelativePath ?? '')
      .split('/')[0]
      ?.trim() || 'workspace'

  return {
    fileCount: files.length,
    rootName,
  }
}

function describeSelectedSource(args: {
  mode: ImportMode
  workspaceSelection: WorkspaceSelection
  zipFileName: string
}) {
  if (args.mode === 'zip') {
    return args.zipFileName || 'No ZIP selected.'
  }

  if (!args.workspaceSelection) {
    return 'No MDship folder selected.'
  }

  return `${args.workspaceSelection.rootName} (${args.workspaceSelection.fileCount} files)`
}

export function PostPackageImportPanel({ onComplete }: PostPackageImportPanelProps) {
  const router = useRouter()
  const { config } = useConfig()
  const zipInputRef = useRef<HTMLInputElement | null>(null)
  const workspaceInputRef = useRef<HTMLInputElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<ImportMode>('mdship')
  const [locale, setLocale] = useState<LocaleSelection>('')
  const [slug, setSlug] = useState('')
  const [workspaceSelection, setWorkspaceSelection] = useState<WorkspaceSelection>(null)
  const [zipFileName, setZipFileName] = useState('')

  useEffect(() => {
    const input = workspaceInputRef.current

    if (!input) {
      return
    }

    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')
    setIsReady(true)
  }, [])

  const selectedLabel = isReady
    ? describeSelectedSource({
        mode,
        workspaceSelection,
        zipFileName,
      })
    : 'Loading import tools…'

  async function handleImport() {
    if (!isReady) {
      toast.error('Import tools are still loading. Try again in a moment.')
      return
    }

    const formData = new FormData()

    if (slug.trim()) {
      formData.append('slug', slug.trim())
    }

    if (mode === 'mdship' && locale) {
      formData.append('locale', locale)
    }

    if (mode === 'zip') {
      const zipFile = zipInputRef.current?.files?.[0]

      if (!zipFile) {
        toast.error('Select a ZIP package first.')
        return
      }

      formData.append('package', zipFile)
    } else {
      const files = Array.from(workspaceInputRef.current?.files ?? [])

      if (files.length === 0) {
        toast.error('Select an MDship workspace folder first.')
        return
      }

      const relativePaths = files.map((file) => {
        const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath

        return relativePath || file.name
      })

      files.forEach((file) => {
        formData.append('workspaceFiles', file)
      })
      formData.append('workspacePaths', JSON.stringify(relativePaths))
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/post-package-import', {
        body: formData,
        credentials: 'include',
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as ImportResponse | null

      if (!response.ok || !payload?.result) {
        throw new Error(payload?.message || `Import failed with status ${response.status}.`)
      }

      const sourceLabel = payload.result.sourceKind === 'mdship' ? 'MDship workspace' : 'package'
      const warningText =
        payload.result.warnings.length > 0 ? ` ${payload.result.warnings.length} warning(s).` : ''

      toast.success(
        `${payload.result.operation === 'created' ? 'Created' : 'Updated'} "${payload.result.slug}" from ${sourceLabel} with ${payload.result.importedLocales.join(', ')} and ${payload.result.importedMediaCount} media file(s).${warningText}`,
      )

      if (zipInputRef.current) {
        zipInputRef.current.value = ''
      }

      if (workspaceInputRef.current) {
        workspaceInputRef.current.value = ''
      }

      setZipFileName('')
      setWorkspaceSelection(null)

      onComplete?.()
      router.push(`${config.routes.admin}/collections/posts/${payload.result.postID}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      className="post-package-import-action"
      data-state={isReady ? 'ready' : 'loading'}
      data-testid="import-panel"
      data-popup-prevent-close
    >
      <div className="post-package-import-action__copy">
        <p className="post-package-import-action__eyebrow">Import packaged content</p>
        <p>Supports <code>MDship</code> workspaces and legacy ZIP bundles.</p>
      </div>

      <div className="post-package-import-action__mode-switch" role="tablist" aria-label="Import mode">
        <button
          aria-selected={mode === 'mdship'}
          className={mode === 'mdship' ? 'is-active' : undefined}
          data-testid="import-mode-mdship"
          disabled={!isReady || isLoading}
          onClick={() => setMode('mdship')}
          type="button"
        >
          MDship folder
        </button>
        <button
          aria-selected={mode === 'zip'}
          className={mode === 'zip' ? 'is-active' : undefined}
          data-testid="import-mode-zip"
          disabled={!isReady || isLoading}
          onClick={() => setMode('zip')}
          type="button"
        >
          ZIP package
        </button>
      </div>

      <div className="post-package-import-action__grid">
        <div className="post-package-import-action__field post-package-import-action__field--source">
          <span>Upload source</span>
          <input
            accept=".zip,application/zip"
            className="post-package-import-action__native-input"
            data-testid="import-zip-input"
            disabled={!isReady || isLoading}
            onChange={(event) => setZipFileName(event.target.files?.[0]?.name ?? '')}
            ref={zipInputRef}
            tabIndex={-1}
            type="file"
          />
          <input
            className="post-package-import-action__native-input"
            data-testid="import-workspace-input"
            disabled={!isReady || isLoading}
            multiple
            onChange={(event) => setWorkspaceSelection(getWorkspaceSelection(event.target.files))}
            ref={workspaceInputRef}
            tabIndex={-1}
            type="file"
          />
          <div className="post-package-import-action__source-card">
            <div
              aria-hidden={mode !== 'mdship'}
              className="post-package-import-action__source-panel"
              hidden={mode !== 'mdship'}
            >
              <Button
                buttonStyle="secondary"
                disabled={!isReady || isLoading}
                onClick={() => workspaceInputRef.current?.click()}
                size="small"
              >
                Choose folder
              </Button>
              <p>Import an MDship export directory with manifest, markdown, bibliography, and assets.</p>
            </div>
            <div
              aria-hidden={mode !== 'zip'}
              className="post-package-import-action__source-panel"
              hidden={mode !== 'zip'}
            >
              <Button
                buttonStyle="secondary"
                disabled={!isReady || isLoading}
                onClick={() => zipInputRef.current?.click()}
                size="small"
              >
                Choose ZIP
              </Button>
              <p>Import the legacy multi-locale archive bundle.</p>
            </div>
          </div>
        </div>

        <label className="post-package-import-action__field">
          <span>Slug override</span>
          <input
            data-testid="import-slug-override"
            disabled={!isReady || isLoading}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Optional"
            type="text"
            value={slug}
          />
        </label>

        <label className="post-package-import-action__field">
          <span>Locale override</span>
          <select
            data-testid="import-locale-override"
            disabled={!isReady || isLoading || mode === 'zip'}
            onChange={(event) => setLocale(event.target.value as LocaleSelection)}
            value={locale}
          >
            <option value="">Auto detect</option>
            {supportedLocales.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
          <small>Used only for MDship folder imports.</small>
        </label>
      </div>

      <div className="post-package-import-action__footer">
        <p className="post-package-import-action__hint" data-testid="import-source-hint">
          {selectedLabel}
        </p>
        <Button
          buttonStyle="primary"
          disabled={!isReady || isLoading}
          extraButtonProps={{
            'data-testid': 'import-submit',
          }}
          onClick={handleImport}
          size="small"
        >
          {isLoading ? 'Importing…' : mode === 'mdship' ? 'Import workspace' : 'Import ZIP'}
        </Button>
      </div>
    </section>
  )
}
