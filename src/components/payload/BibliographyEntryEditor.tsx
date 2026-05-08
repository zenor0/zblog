'use client'

import type { BibliographyName, EditableBibliographyEntry } from '@/lib/bibliography'

import { Button, Collapsible, Pill } from '@payloadcms/ui'

import {
  bibliographyEntryTextFields,
  creatorSections,
  entryTypeOptions,
  getEntrySummaryTitle,
  type CreatorRole,
  type TextEntryFieldName,
} from './bibliographyFieldModel'

type BibliographyEntryEditorProps = {
  addName: (entryIndex: number, role: CreatorRole) => void
  entry: EditableBibliographyEntry
  entryIndex: number
  isExpanded: boolean
  removeEntry: (entryIndex: number) => void
  removeName: (entryIndex: number, role: CreatorRole, personIndex: number) => void
  setEntryExpanded: (
    entry: EditableBibliographyEntry,
    entryIndex: number,
    isExpanded: boolean,
  ) => void
  stateKey: string
  updateEntry: (
    entryIndex: number,
    fieldName: keyof EditableBibliographyEntry,
    value: EditableBibliographyEntry[keyof EditableBibliographyEntry],
  ) => void
  updateName: (
    entryIndex: number,
    role: CreatorRole,
    personIndex: number,
    fieldName: keyof BibliographyName,
    value: BibliographyName[keyof BibliographyName],
  ) => void
}

function TextEntryField(props: {
  entry: EditableBibliographyEntry
  field: (typeof bibliographyEntryTextFields)[number]
  onChange: (name: TextEntryFieldName, value: string) => void
}) {
  const { entry, field, onChange } = props

  return (
    <label className={field.className}>
      <span>{field.label}</span>
      {field.multiline ? (
        <textarea
          onChange={(event) => onChange(field.name, event.target.value)}
          rows={field.rows}
          value={entry[field.name]}
        />
      ) : (
        <input
          onChange={(event) => onChange(field.name, event.target.value)}
          type="text"
          value={entry[field.name]}
        />
      )}
    </label>
  )
}

function PersonEditor(props: {
  entryIndex: number
  person: BibliographyName
  personIndex: number
  removeName: (entryIndex: number, role: CreatorRole, personIndex: number) => void
  role: CreatorRole
  updateName: BibliographyEntryEditorProps['updateName']
}) {
  const { entryIndex, person, personIndex, removeName, role, updateName } = props

  return (
    <div className="bibliography-field__person">
      {(
        [
          ['given', 'Given'],
          ['family', 'Family'],
          ['literal', 'Literal'],
        ] as const
      ).map(([fieldName, label]) => (
        <label key={fieldName}>
          <span>{label}</span>
          <input
            onChange={(event) =>
              updateName(entryIndex, role, personIndex, fieldName, event.target.value)
            }
            type="text"
            value={person[fieldName]}
          />
        </label>
      ))}

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
  )
}

export function BibliographyEntryEditor(props: BibliographyEntryEditorProps) {
  const {
    addName,
    entry,
    entryIndex,
    isExpanded,
    removeEntry,
    removeName,
    setEntryExpanded,
    stateKey,
    updateEntry,
    updateName,
  } = props

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
      onToggle={(nextCollapsed) => setEntryExpanded(entry, entryIndex, !nextCollapsed)}
    >
      <div className="bibliography-field__entry-body">
        <div className="bibliography-field__grid">
          {bibliographyEntryTextFields.slice(0, 1).map((field) => (
            <TextEntryField
              entry={entry}
              field={field}
              key={field.name}
              onChange={(fieldName, value) => updateEntry(entryIndex, fieldName, value)}
            />
          ))}

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

          {bibliographyEntryTextFields.slice(1).map((field) => (
            <TextEntryField
              entry={entry}
              field={field}
              key={field.name}
              onChange={(fieldName, value) => updateEntry(entryIndex, fieldName, value)}
            />
          ))}
        </div>

        {creatorSections.map(({ label, role }) => (
          <section className="bibliography-field__people" key={`${stateKey}-${role}`}>
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
              <p className="bibliography-field__people-empty">No {label.toLowerCase()} added.</p>
            ) : null}

            {entry[role].map((person, personIndex) => (
              <PersonEditor
                entryIndex={entryIndex}
                key={`${stateKey}-${role}-${personIndex}`}
                person={person}
                personIndex={personIndex}
                removeName={removeName}
                role={role}
                updateName={updateName}
              />
            ))}
          </section>
        ))}
      </div>
    </Collapsible>
  )
}
