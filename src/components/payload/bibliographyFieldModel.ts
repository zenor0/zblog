import type { BibliographyName, EditableBibliographyEntry } from '@/lib/bibliography'

export const entryTypeOptions = [
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

export type CreatorRole = 'authors' | 'editors' | 'translators'
export type Mode = 'raw' | 'structured'

export type TextEntryFieldName = {
  [Key in keyof EditableBibliographyEntry]: EditableBibliographyEntry[Key] extends string
    ? Key
    : never
}[keyof EditableBibliographyEntry]

export type BibliographyEntryTextField = {
  className?: string
  label: string
  multiline?: boolean
  name: TextEntryFieldName
  rows?: number
}

export const bibliographyEntryTextFields: BibliographyEntryTextField[] = [
  {
    label: 'Citation key',
    name: 'citationKey',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'Title',
    name: 'title',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'Subtitle',
    name: 'subtitle',
  },
  {
    label: 'Date',
    name: 'date',
  },
  {
    label: 'Accessed',
    name: 'accessed',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'Journal',
    name: 'journalTitle',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'Book title',
    name: 'bookTitle',
  },
  {
    label: 'Publisher',
    name: 'publisher',
  },
  {
    label: 'Institution',
    name: 'institution',
  },
  {
    label: 'Volume',
    name: 'volume',
  },
  {
    label: 'Number',
    name: 'number',
  },
  {
    label: 'Pages',
    name: 'pages',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'DOI',
    name: 'doi',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'URL',
    name: 'url',
  },
  {
    className: 'bibliography-field__grid-span',
    label: 'Note',
    multiline: true,
    name: 'note',
    rows: 3,
  },
]

export const creatorSections: { label: string; role: CreatorRole }[] = [
  {
    label: 'Authors',
    role: 'authors',
  },
  {
    label: 'Editors',
    role: 'editors',
  },
  {
    label: 'Translators',
    role: 'translators',
  },
]

function createDefaultCitationKey(entryIndex: number): string {
  return `reference-${entryIndex + 1}`
}

export function createEmptyName(): BibliographyName {
  return {
    family: '',
    given: '',
    literal: '',
    prefix: '',
    suffix: '',
    usePrefix: false,
  }
}

export function createEmptyEntry(entryIndex: number): EditableBibliographyEntry {
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

export function cloneEntry(entry: EditableBibliographyEntry): EditableBibliographyEntry {
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

export function normalizeEntry(entry: EditableBibliographyEntry): EditableBibliographyEntry {
  return {
    ...entry,
    authors: hasMeaningfulNames(entry.authors) ? entry.authors : [],
    editors: hasMeaningfulNames(entry.editors) ? entry.editors : [],
    translators: hasMeaningfulNames(entry.translators) ? entry.translators : [],
  }
}

export function getEntryStateKey(entry: EditableBibliographyEntry, entryIndex: number): string {
  return `${entry.citationKey || `entry-${entryIndex + 1}`}-${entryIndex}`
}

export function getEntrySummaryTitle(entry: EditableBibliographyEntry): string {
  return entry.title.trim() || 'Untitled reference'
}
