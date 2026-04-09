'use client'

import type { GroupFieldClientComponent } from 'payload'
import type { BibliographyName, EditableBibliographyEntry } from '@/lib/bibliography'

import { Button, Collapsible, Pill, TextInput, useField } from '@payloadcms/ui'
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import { parseEditableBibliography, serializeEditableBibliography } from '@/lib/bibliography'

import './bibliography-field.scss'

const entryTypeOptions = [
  'article',
  'book',
  'inbook',
  'incollection',
  'inproceedings',
  'manual',
  'misc',
  'online',
  'phdthesis',
  'proceedings',
  'report',
  'techreport',
  'thesis',
] as const

type CreatorRole = 'authors' | 'editors' | 'translators'
type Mode = 'raw' | 'structured'

function createDefaultCitationKey(entryIndex: number): string {
  return `reference-${entryIndex + 1}`
}

function createEmptyName(): BibliographyName {
  return {
    family: '',
    given: '',
    literal: '',
    prefix: '',
    suffix: '',
    usePrefix: false,
  }
}

function createEmptyEntry(entryIndex: number): EditableBibliographyEntry {
  return {
    accessed: '',
    authors: [createEmptyName()],
    bookTitle: '',
    citationKey: createDefaultCitationKey(entryIndex),
    date: '',
    doi: '',
    editors: [],
    entryType: 'misc',
    eventTitle: '',
    institution: '',
    journalTitle: '',
    location: '',
    note: '',
    number: '',
    organization: '',
    pages: '',
    publisher: '',
    school: '',
    seriesTitle: '',
    subtitle: '',
    title: '',
    translators: [],
    url: '',
    venue: '',
    volume: '',
  }
}

function cloneEntry(entry: EditableBibliographyEntry): EditableBibliographyEntry {
  return {
    ...entry,
    authors: entry.authors.map((person) => ({ ...person })),
    editors: entry.editors.map((person) => ({ ...person })),
    translators: entry.translators.map((person) => ({ ...person })),
  }
}

function hasMeaningfulNames(people: BibliographyName[]): boolean {
  return people.some((person) =>
    [person.family, person.given, person.literal, person.prefix, person.suffix]
      .filter(Boolean)
      .join('')
      .trim(),
  )
}

function normalizeEntry(entry: EditableBibliographyEntry): EditableBibliographyEntry {
  return {
    ...entry,
    authors: hasMeaningfulNames(entry.authors) ? entry.authors : [],
    editors: hasMeaningfulNames(entry.editors) ? entry.editors : [],
    translators: hasMeaningfulNames(entry.translators) ? entry.translators : [],
  }
}

function getEntryStateKey(entry: EditableBibliographyEntry, entryIndex: number): string {
  return `${entry.citationKey || `entry-${entryIndex + 1}`}-${entryIndex}`
}

function getEntrySummaryTitle(entry: EditableBibliographyEntry): string {
  return entry.title.trim() || 'Untitled reference'
}

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

  const importedFileName =
    typeof filenameField.value === 'string' ? filenameField.value.trim() : ''

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
          onChange={(event: ChangeEvent<HTMLInputElement>) => filenameField.setValue(event.target.value)}
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
            const isExpanded = expandedEntries[entryKey] === true

            return (
              <Collapsible
                actions={
                  <Button
                    buttonStyle="secondary"
                    margin={false}
                    onClick={() => removeEntry(entryIndex)}
                    size="small"
                    type="button"
                  >
                    Remove entry
                  </Button>
                }
                className="bibliography-field__entry"
                header={
                  <div className="bibliography-field__entry-summary">
                    <div className="bibliography-field__entry-heading">
                      <strong>{entry.citationKey || `Entry ${entryIndex + 1}`}</strong>
                      <span>{getEntrySummaryTitle(entry)}</span>
                    </div>

                    <div className="bibliography-field__entry-meta">
                      <Pill pillStyle="light" size="small">
                        {entry.entryType}
                      </Pill>
                      {entry.authors.length > 0 ? (
                        <span>
                          {entry.authors.length} author{entry.authors.length > 1 ? 's' : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                }
                isCollapsed={!isExpanded}
                key={entryKey}
                onToggle={(nextCollapsed) => setEntryExpanded(entry, entryIndex, !nextCollapsed)}
              >
                <div className="bibliography-field__entry-body">
                  <div className="bibliography-field__grid">
                    <label>
                      <span>Citation key</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'citationKey', event.target.value)
                        }
                        type="text"
                        value={entry.citationKey}
                      />
                    </label>

                    <label>
                      <span>Entry type</span>
                      <select
                        onChange={(event) => updateEntry(entryIndex, 'entryType', event.target.value)}
                        value={entry.entryType}
                      >
                        {entryTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>Title</span>
                      <input
                        onChange={(event) => updateEntry(entryIndex, 'title', event.target.value)}
                        type="text"
                        value={entry.title}
                      />
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>Subtitle</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'subtitle', event.target.value)
                        }
                        type="text"
                        value={entry.subtitle}
                      />
                    </label>

                    <label>
                      <span>Date</span>
                      <input
                        onChange={(event) => updateEntry(entryIndex, 'date', event.target.value)}
                        type="text"
                        value={entry.date}
                      />
                    </label>

                    <label>
                      <span>Accessed</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'accessed', event.target.value)
                        }
                        type="text"
                        value={entry.accessed}
                      />
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>Journal</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'journalTitle', event.target.value)
                        }
                        type="text"
                        value={entry.journalTitle}
                      />
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>Book title</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'bookTitle', event.target.value)
                        }
                        type="text"
                        value={entry.bookTitle}
                      />
                    </label>

                    <label>
                      <span>Publisher</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'publisher', event.target.value)
                        }
                        type="text"
                        value={entry.publisher}
                      />
                    </label>

                    <label>
                      <span>Institution</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'institution', event.target.value)
                        }
                        type="text"
                        value={entry.institution}
                      />
                    </label>

                    <label>
                      <span>Volume</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'volume', event.target.value)
                        }
                        type="text"
                        value={entry.volume}
                      />
                    </label>

                    <label>
                      <span>Number</span>
                      <input
                        onChange={(event) =>
                          updateEntry(entryIndex, 'number', event.target.value)
                        }
                        type="text"
                        value={entry.number}
                      />
                    </label>

                    <label>
                      <span>Pages</span>
                      <input
                        onChange={(event) => updateEntry(entryIndex, 'pages', event.target.value)}
                        type="text"
                        value={entry.pages}
                      />
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>DOI</span>
                      <input
                        onChange={(event) => updateEntry(entryIndex, 'doi', event.target.value)}
                        type="text"
                        value={entry.doi}
                      />
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>URL</span>
                      <input
                        onChange={(event) => updateEntry(entryIndex, 'url', event.target.value)}
                        type="text"
                        value={entry.url}
                      />
                    </label>

                    <label className="bibliography-field__grid-span">
                      <span>Note</span>
                      <textarea
                        onChange={(event) => updateEntry(entryIndex, 'note', event.target.value)}
                        rows={3}
                        value={entry.note}
                      />
                    </label>
                  </div>

                  {(
                    [
                      ['authors', 'Authors'],
                      ['editors', 'Editors'],
                      ['translators', 'Translators'],
                    ] as const
                  ).map(([role, label]) => (
                    <section className="bibliography-field__people" key={`${entryIndex}-${role}`}>
                      <header className="bibliography-field__people-header">
                        <strong>{label}</strong>
                        <Button
                          buttonStyle="secondary"
                          margin={false}
                          onClick={() => addName(entryIndex, role)}
                          size="small"
                          type="button"
                        >
                          Add person
                        </Button>
                      </header>

                      {entry[role].length === 0 ? (
                        <p className="bibliography-field__people-empty">
                          No {label.toLowerCase()} added.
                        </p>
                      ) : null}

                      {entry[role].map((person, personIndex) => (
                        <div className="bibliography-field__person" key={`${role}-${personIndex}`}>
                          <label>
                            <span>Given</span>
                            <input
                              onChange={(event) =>
                                updateName(
                                  entryIndex,
                                  role,
                                  personIndex,
                                  'given',
                                  event.target.value,
                                )
                              }
                              type="text"
                              value={person.given}
                            />
                          </label>

                          <label>
                            <span>Family</span>
                            <input
                              onChange={(event) =>
                                updateName(
                                  entryIndex,
                                  role,
                                  personIndex,
                                  'family',
                                  event.target.value,
                                )
                              }
                              type="text"
                              value={person.family}
                            />
                          </label>

                          <label>
                            <span>Literal</span>
                            <input
                              onChange={(event) =>
                                updateName(
                                  entryIndex,
                                  role,
                                  personIndex,
                                  'literal',
                                  event.target.value,
                                )
                              }
                              type="text"
                              value={person.literal}
                            />
                          </label>

                          <Button
                            buttonStyle="secondary"
                            margin={false}
                            onClick={() => removeName(entryIndex, role, personIndex)}
                            size="small"
                            type="button"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              </Collapsible>
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
