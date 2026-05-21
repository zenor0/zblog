'use client'

import { Button, toast } from '@payloadcms/ui'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  siteDataExportPresets,
  siteDataTransferGroupIDs,
  type SiteDataTransferGroupID,
} from '@/features/site-data-transfer/model/site-data-transfer'
import type {
  SiteDataExportFile,
  SiteDataImportPreview,
} from '@/features/site-data-transfer/server/site-data-transfer-service'

type ExportResponse = {
  file?: SiteDataExportFile
  message?: string
}

type ExportListResponse = {
  files?: SiteDataExportFile[]
  message?: string
}

type ImportCommitResponse = {
  appliedGroups?: SiteDataTransferGroupID[]
  message?: string
}

const groupLabels: Record<SiteDataTransferGroupID, string> = {
  'frontend-variants': 'Frontend variants',
  media: 'Media',
  pages: 'Pages',
  posts: 'Posts',
  'post-versions': 'Post versions',
  'post-view-metrics': 'Post view metrics',
  'site-settings': 'Site settings',
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function isTransferGroup(value: string): value is SiteDataTransferGroupID {
  return siteDataTransferGroupIDs.includes(value as SiteDataTransferGroupID)
}

function getPresetGroups(presetID: keyof typeof siteDataExportPresets) {
  return [...siteDataExportPresets[presetID].groups]
}

export function DataTransferPanel() {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [exportFiles, setExportFiles] = useState<SiteDataExportFile[]>([])
  const [exportGroups, setExportGroups] = useState<SiteDataTransferGroupID[]>(
    getPresetGroups('configuration'),
  )
  const [exportPreset, setExportPreset] =
    useState<keyof typeof siteDataExportPresets>('configuration')
  const [importPreview, setImportPreview] = useState<SiteDataImportPreview | null>(null)
  const [importSelection, setImportSelection] = useState<SiteDataTransferGroupID[]>([])
  const [isCommitting, setIsCommitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const selectedExportPreset = siteDataExportPresets[exportPreset]
  const selectableImportGroups = useMemo(
    () => importPreview?.manifest.groups ?? [],
    [importPreview?.manifest.groups],
  )
  const importHasChanges = importPreview?.summary.hasChanges ?? false

  async function loadExports() {
    setIsLoadingFiles(true)

    try {
      const response = await fetch('/api/site-data-transfer/exports', {
        credentials: 'include',
      })
      const payload = (await response.json().catch(() => null)) as ExportListResponse | null

      if (!response.ok) {
        throw new Error(payload?.message || `Could not load exports (${response.status}).`)
      }

      setExportFiles(payload?.files ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load exports.')
    } finally {
      setIsLoadingFiles(false)
    }
  }

  useEffect(() => {
    void loadExports()
  }, [])

  function applyPreset(nextPreset: keyof typeof siteDataExportPresets) {
    setExportPreset(nextPreset)
    setExportGroups(getPresetGroups(nextPreset))
  }

  function toggleExportGroup(group: SiteDataTransferGroupID) {
    setExportGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    )
  }

  function toggleImportGroup(group: SiteDataTransferGroupID) {
    setImportSelection((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    )
  }

  async function createExport() {
    if (exportGroups.length === 0) {
      toast.error('Select at least one export group.')
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch('/api/site-data-transfer/exports', {
        body: JSON.stringify({
          groups: exportGroups,
          preset: exportPreset,
        }),
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as ExportResponse | null

      if (!response.ok || !payload?.file) {
        throw new Error(payload?.message || `Export failed (${response.status}).`)
      }

      toast.success(`Created ${payload.file.id}.`)
      await loadExports()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed.')
    } finally {
      setIsExporting(false)
    }
  }

  async function deleteExport(fileID: string) {
    try {
      const response = await fetch(
        `/api/site-data-transfer/exports/${encodeURIComponent(fileID)}`,
        {
          credentials: 'include',
          method: 'DELETE',
        },
      )

      if (!response.ok) {
        throw new Error(`Delete failed (${response.status}).`)
      }

      toast.success(`Deleted ${fileID}.`)
      await loadExports()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed.')
    }
  }

  async function previewImport() {
    const file = importInputRef.current?.files?.[0]

    if (!file) {
      toast.error('Select an export ZIP first.')
      return
    }

    const formData = new FormData()
    formData.append('package', file)
    setIsPreviewing(true)

    try {
      const response = await fetch('/api/site-data-transfer/imports/preview', {
        body: formData,
        credentials: 'include',
        method: 'POST',
      })
      const payload = (await response.json().catch(() => null)) as SiteDataImportPreview & {
        message?: string
      }

      if (!response.ok || !payload?.token) {
        throw new Error(payload?.message || `Preview failed (${response.status}).`)
      }

      setImportPreview(payload)
      setImportSelection(payload.summary.defaultSelectedGroups)
      toast.success('Import preview is ready.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import preview failed.')
    } finally {
      setIsPreviewing(false)
    }
  }

  async function commitImport() {
    if (!importPreview) {
      return
    }

    if (importHasChanges && importSelection.length === 0) {
      toast.error('Select at least one group to import.')
      return
    }

    const groupsToImport = importHasChanges ? importSelection : []

    setIsCommitting(true)

    try {
      const response = await fetch(
        `/api/site-data-transfer/imports/${encodeURIComponent(importPreview.token)}/commit`,
        {
          body: JSON.stringify({
            groups: groupsToImport,
          }),
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          method: 'POST',
        },
      )
      const payload = (await response.json().catch(() => null)) as ImportCommitResponse | null

      if (!response.ok) {
        throw new Error(payload?.message || `Import failed (${response.status}).`)
      }

      if (!importHasChanges && groupsToImport.length === 0) {
        toast.success('No changes to import.')
      } else {
        toast.success(
          `Imported ${payload?.appliedGroups?.length ?? groupsToImport.length} group(s).`,
        )
      }

      setImportPreview(null)
      setImportSelection([])

      if (importInputRef.current) {
        importInputRef.current.value = ''
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed.')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <main className="site-data-transfer">
      <header className="site-data-transfer__header">
        <div>
          <p className="site-data-transfer__eyebrow">Operations</p>
          <h1>Data transfer</h1>
          <p className="site-data-transfer__intro">
            Payload data migration packages for schema-aware import. Use volume backups for raw
            SQLite snapshots.
          </p>
        </div>
        <Button
          buttonStyle="secondary"
          disabled={isLoadingFiles}
          onClick={loadExports}
          size="small"
        >
          Refresh
        </Button>
      </header>

      <section className="site-data-transfer__section">
        <div className="site-data-transfer__section-header">
          <div>
            <h2>Create export</h2>
            <p>{selectedExportPreset.description}</p>
          </div>
          <Button buttonStyle="primary" disabled={isExporting} onClick={createExport} size="small">
            {isExporting ? 'Exporting...' : 'Create export'}
          </Button>
        </div>

        <div className="site-data-transfer__grid">
          <label className="site-data-transfer__field">
            <span>Preset</span>
            <select
              onChange={(event) =>
                applyPreset(event.target.value as keyof typeof siteDataExportPresets)
              }
              value={exportPreset}
            >
              {Object.values(siteDataExportPresets).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          <div className="site-data-transfer__checks">
            {siteDataTransferGroupIDs.map((group) => (
              <label key={group}>
                <input
                  checked={exportGroups.includes(group)}
                  onChange={() => toggleExportGroup(group)}
                  type="checkbox"
                />
                <span>{groupLabels[group]}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="site-data-transfer__section">
        <div className="site-data-transfer__section-header">
          <div>
            <h2>Saved exports</h2>
            <p>{exportFiles.length} file(s) on this server.</p>
          </div>
        </div>

        <div className="site-data-transfer__file-list">
          {exportFiles.length === 0 ? (
            <p className="site-data-transfer__empty">No saved exports.</p>
          ) : (
            exportFiles.map((file) => (
              <article className="site-data-transfer__file" key={file.id}>
                <div>
                  <strong>{file.id}</strong>
                  <span>
                    {new Date(file.createdAt).toLocaleString()} · {formatBytes(file.size)} ·{' '}
                    {file.manifest.groups.map((group) => groupLabels[group]).join(', ')}
                  </span>
                </div>
                <div className="site-data-transfer__file-actions">
                  <a href={file.downloadURL}>Download</a>
                  <button onClick={() => void deleteExport(file.id)} type="button">
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="site-data-transfer__section">
        <div className="site-data-transfer__section-header">
          <div>
            <h2>Import</h2>
            <p>Review grouped changes before writing data.</p>
          </div>
          <div className="site-data-transfer__actions">
            <Button
              buttonStyle="secondary"
              onClick={() => importInputRef.current?.click()}
              size="small"
            >
              Choose ZIP
            </Button>
            <Button
              buttonStyle="primary"
              disabled={isPreviewing}
              onClick={previewImport}
              size="small"
            >
              {isPreviewing ? 'Previewing...' : 'Preview import'}
            </Button>
          </div>
        </div>

        <input
          accept=".zip,application/zip"
          className="site-data-transfer__native-input"
          ref={importInputRef}
          type="file"
        />

        {importPreview ? (
          <div className="site-data-transfer__preview">
            <div className="site-data-transfer__preview-header">
              <strong>{importPreview.manifest.exportID}</strong>
              <span>
                {importPreview.summary.totals.creates} new · {importPreview.summary.totals.updates}{' '}
                update · {importPreview.summary.totals.conflicts} conflict ·{' '}
                {importPreview.summary.totals.warnings} warning
              </span>
            </div>

            {!importHasChanges ? (
              <p className="site-data-transfer__empty">
                No changes detected. This export already matches the site.
              </p>
            ) : null}

            <div className="site-data-transfer__diff-grid">
              {selectableImportGroups.filter(isTransferGroup).map((group) => {
                const groupDiff = importPreview.diff.groups[group]

                if (!groupDiff) {
                  return null
                }

                return (
                  <label className="site-data-transfer__diff-card" key={group}>
                    <input
                      checked={importSelection.includes(group)}
                      disabled={!importHasChanges}
                      onChange={() => toggleImportGroup(group)}
                      type="checkbox"
                    />
                    <span>
                      <strong>{groupLabels[group]}</strong>
                      <small>
                        {groupDiff.creates} new · {groupDiff.updates} update · {groupDiff.skips}{' '}
                        unchanged · {groupDiff.conflicts} conflict
                      </small>
                    </span>
                  </label>
                )
              })}
            </div>

            <Button
              buttonStyle="primary"
              disabled={isCommitting}
              onClick={commitImport}
              size="small"
            >
              {isCommitting
                ? 'Importing...'
                : importHasChanges
                  ? 'Import selected groups'
                  : 'Finish import'}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  )
}
