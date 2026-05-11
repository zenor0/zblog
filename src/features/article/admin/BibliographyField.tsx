'use client'

import type { GroupFieldClientComponent } from 'payload'
import type { BibliographyName, EditableBibliographyEntry } from '@/features/article/model/bibliography'

import { Button, TextInput, useField } from '@payloadcms/ui'
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'

import { parseEditableBibliography, serializeEditableBibliography } from '@/features/article/model/bibliography'

import { BibliographyEntryEditor } from './BibliographyEntryEditor'
import {
  cloneEntry,
  createEmptyEntry,
  createEmptyName,
  getEntryStateKey,
  normalizeEntry,
  type CreatorRole,
  type Mode,
} from './bibliographyFieldModel'

import './bibliography-field.scss'

export const BibliographyField: GroupFieldClientComponent = ({ path }) => {
  const sourcePath = `${path}.source`
  const filenamePath = `${path}.filename`
  const sourceField = useField<string>({ path: sourcePath })
  const filenameField = useField<string>({ path: filenamePath })
  const [mode, setMode] = useState<Mode>('structured')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const deferredSource = useDeferredValue(
    typeof sourceField.value === 'string' ? sourceField.value : '',
  )
  const parsed = useMemo(() => parseEditableBibliography(deferredSource), [deferredSource])
  const [entries, setEntries] = useState<EditableBibliographyEntry[]>(
    parsed.entries.map(cloneEntry),
  )
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setEntries(parsed.entries.map(cloneEntry))
    setExpandedEntries((current) => {
      const next: Record<string, boolean> = {}

      parsed.entries.forEach((entry, entryIndex) => {
        const key = getEntryStateKey(entry, entryIndex)

        if (current[key]) {
          next[key] = true
        }
      })

      return next
    })
  }, [parsed.entries])

  useEffect(() => {
    if (mode === 'structured' && deferredSource.trim() && !parsed.isFullyEditable) {
      setMode('raw')
    }
  }, [deferredSource, mode, parsed.isFullyEditable])

  function commitEntries(nextEntries: EditableBibliographyEntry[]) {
    const normalized = nextEntries.map((entry) => normalizeEntry(entry))

    setEntries(normalized.map(cloneEntry))
    sourceField.setValue(serializeEditableBibliography(normalized))
  }

  function updateEntry(
    entryIndex: number,
    fieldName: keyof EditableBibliographyEntry,
    value: EditableBibliographyEntry[keyof EditableBibliographyEntry],
  ) {
    const nextEntries = entries.map((entry, index) =>
      index === entryIndex
        ? ({ ...entry, [fieldName]: value } as EditableBibliographyEntry)
        : entry,
    )

    commitEntries(nextEntries)
  }

  function updateName(
    entryIndex: number,
    role: CreatorRole,
    personIndex: number,
    fieldName: keyof BibliographyName,
    value: BibliographyName[keyof BibliographyName],
  ) {
    const nextEntries = entries.map((entry, index) => {
      if (index !== entryIndex) {
        return entry
      }

      const nextPeople = entry[role].map((person, currentIndex) =>
        currentIndex === personIndex
          ? ({ ...person, [fieldName]: value } as BibliographyName)
          : person,
      )

      return {
        ...entry,
        [role]: nextPeople,
      }
    })

    commitEntries(nextEntries)
  }

  function addEntry() {
    const nextEntry = createEmptyEntry(entries.length)
    const nextKey = getEntryStateKey(nextEntry, entries.length)

    setExpandedEntries((current) => ({
      ...current,
      [nextKey]: true,
    }))
    commitEntries([...entries, nextEntry])
  }

  function removeEntry(entryIndex: number) {
    commitEntries(entries.filter((_, index) => index !== entryIndex))
  }

  function addName(entryIndex: number, role: CreatorRole) {
    const nextEntries = entries.map((entry, index) =>
      index === entryIndex
        ? {
            ...entry,
            [role]: [...entry[role], createEmptyName()],
          }
        : entry,
    )

    commitEntries(nextEntries)
  }

  function removeName(entryIndex: number, role: CreatorRole, personIndex: number) {
    const nextEntries = entries.map((entry, index) =>
      index === entryIndex
        ? {
            ...entry,
            [role]: entry[role].filter((_, currentIndex) => currentIndex !== personIndex),
          }
        : entry,
    )

    commitEntries(nextEntries)
  }

  function setEntryExpanded(
    entry: EditableBibliographyEntry,
    entryIndex: number,
    isExpanded: boolean,
  ) {
    const key = getEntryStateKey(entry, entryIndex)

    setExpandedEntries((current) => ({
      ...current,
      [key]: isExpanded,
    }))
  }

  async function handleFileImport(file: File | null | undefined) {
    if (!file) {
      return
    }

    const text = await file.text()

    filenameField.setValue(file.name)
    sourceField.setValue(text)
    setMode('raw')
  }

  const importedFileName = typeof filenameField.value === 'string' ? filenameField.value.trim() : ''

  return (
    <section className="bibliography-field field-type">
      <header className="bibliography-field__header">
        <div>
          <p className="bibliography-field__eyebrow">Bibliography</p>
          <h3>Post-owned BibTeX source</h3>
          <p>
            This bibliography belongs only to the current post. Structured editing is available for
            safe, common entries. Raw BibTeX is always available as the fallback.
          </p>
        </div>

        <div
          className="bibliography-field__mode-switch"
          role="tablist"
          aria-label="Bibliography mode"
        >
          <Button
            aria-selected={mode === 'structured'}
            buttonStyle={mode === 'structured' ? 'primary' : 'secondary'}
            disabled={Boolean(deferredSource.trim()) && !parsed.isFullyEditable}
            onClick={() => setMode('structured')}
            size="small"
            type="button"
          >
            Structured
          </Button>
          <Button
            aria-selected={mode === 'raw'}
            buttonStyle={mode === 'raw' ? 'primary' : 'secondary'}
            onClick={() => setMode('raw')}
            size="small"
            type="button"
          >
            Raw BibTeX
          </Button>
        </div>
      </header>

      {!parsed.isFullyEditable && deferredSource.trim() ? (
        <div className="bibliography-field__warning">
          <strong>Structured editing disabled for this source.</strong>
          <ul>
            {parsed.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="bibliography-field__meta">
        <TextInput
          label="Original filename"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            filenameField.setValue(event.target.value)
          }
          path={filenamePath}
          placeholder="Optional .bib filename"
          value={typeof filenameField.value === 'string' ? filenameField.value : ''}
        />

        <input
          accept=".bib,text/x-bibtex,text/plain"
          className="bibliography-field__file-input"
          data-testid="bibliography-upload-input"
          hidden
          onChange={(event) => void handleFileImport(event.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />

        <div className="bibliography-field__upload-panel">
          <div className="bibliography-field__upload-copy">
            <span>Imported BibTeX file</span>
            <strong>{importedFileName || 'No .bib file selected yet'}</strong>
            <p>
              {importedFileName
                ? 'Upload another file to replace the current post-owned source.'
                : 'Choose a .bib file to populate the raw source field without exposing the native file input.'}
            </p>
          </div>

          <Button
            buttonStyle="secondary"
            className="bibliography-field__upload"
            margin={false}
            onClick={() => fileInputRef.current?.click()}
            size="small"
            type="button"
          >
            Upload .bib
          </Button>
        </div>
      </div>

      {mode === 'raw' ? (
        <label className="bibliography-field__raw">
          <span>Raw BibTeX source</span>
          <textarea
            onChange={(event) => sourceField.setValue(event.target.value)}
            placeholder="@article{citation-key,...}"
            rows={18}
            value={typeof sourceField.value === 'string' ? sourceField.value : ''}
          />
        </label>
      ) : (
        <div className="bibliography-field__entries">
          {entries.length === 0 ? (
            <div className="bibliography-field__empty">
              <strong>No bibliography entries yet.</strong>
              <span>Add an entry or switch to raw mode to paste an existing BibTeX file.</span>
            </div>
          ) : null}

          {entries.map((entry, entryIndex) => {
            const entryKey = getEntryStateKey(entry, entryIndex)

            return (
              <BibliographyEntryEditor
                addName={addName}
                entry={entry}
                entryIndex={entryIndex}
                isExpanded={expandedEntries[entryKey] === true}
                key={entryKey}
                removeEntry={removeEntry}
                removeName={removeName}
                setEntryExpanded={setEntryExpanded}
                stateKey={entryKey}
                updateEntry={updateEntry}
                updateName={updateName}
              />
            )
          })}

          <Button
            className="bibliography-field__add-entry"
            buttonStyle="secondary"
            margin={false}
            onClick={addEntry}
            size="small"
            type="button"
          >
            Add bibliography entry
          </Button>
        </div>
      )}
    </section>
  )
}

export default BibliographyField
