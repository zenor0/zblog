import { BibLatexParser, type BibDB } from 'biblatex-csl-converter'

import { extractCitationKeys, normalizeCitationKey } from '@/features/article/model/citations'

export type BibliographySource = {
  filename?: string | null
  source?: string | null
}

type RawBibliographyEntry = BibDB[number]

type BibliographyNode = {
  attrs?: Record<string, unknown>
  text?: string
  type: string
}

type RawBibliographyName = {
  family?: BibliographyNode[]
  given?: BibliographyNode[]
  literal?: BibliographyNode[]
  prefix?: BibliographyNode[]
  suffix?: BibliographyNode[]
  useprefix?: boolean
}

export type BibliographyEntry = {
  citationKey: string
  entryType: string
  fields: Record<string, string>
  accessed: BibliographyPartialDate | null
  authors: BibliographyName[]
  containerTitle: string
  doi: string
  editors: BibliographyName[]
  eventTitle: string
  institution: string
  issued: BibliographyPartialDate | null
  journalTitle: string
  location: string
  number: string
  organization: string
  pages: string
  publisher: string
  school: string
  seriesTitle: string
  subtitle: string
  title: string
  translators: BibliographyName[]
  url: string
  venue: string
  volume: string
}

export type BibliographyName = {
  family: string
  given: string
  literal: string
  prefix: string
  suffix: string
  usePrefix: boolean
}

export type BibliographyPartialDate = {
  day: null | string
  literal: string
  month: null | string
  year: null | string
}

export type BibliographyDisplayLink = {
  href: string
  label: 'DOI' | 'URL'
  value: string
}

export type BibliographyDisplay = {
  accessed: string
  container: string
  creatorRole: 'author' | 'editor' | 'none' | 'translator'
  creators: string
  links: BibliographyDisplayLink[]
  secondary: string[]
  title: string
  year: string
}

export type EditableBibliographyEntry = {
  accessed: string
  authors: BibliographyName[]
  bookTitle: string
  citationKey: string
  date: string
  doi: string
  editors: BibliographyName[]
  entryType: string
  eventTitle: string
  institution: string
  journalTitle: string
  location: string
  note: string
  number: string
  organization: string
  pages: string
  publisher: string
  school: string
  seriesTitle: string
  subtitle: string
  title: string
  translators: BibliographyName[]
  url: string
  venue: string
  volume: string
}

export type EditableBibliographyParseResult = {
  entries: EditableBibliographyEntry[]
  isFullyEditable: boolean
  issues: string[]
}

const supportedEditableEntryTypes = new Set([
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
])

const supportedEditableFieldKeys = new Set([
  'author',
  'booktitle',
  'date',
  'doi',
  'editor',
  'eventtitle',
  'institution',
  'journaltitle',
  'location',
  'note',
  'number',
  'organization',
  'pages',
  'publisher',
  'school',
  'series',
  'subtitle',
  'title',
  'translator',
  'url',
  'urldate',
  'venue',
  'volume',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function isBibliographyNode(value: unknown): value is BibliographyNode {
  return isPlainObject(value) && typeof value.type === 'string'
}

function isBibliographyNodeArray(value: unknown): value is BibliographyNode[] {
  return Array.isArray(value) && value.every((item) => isBibliographyNode(item))
}

function nodeArrayToText(value: unknown): string {
  if (!isBibliographyNodeArray(value)) {
    return typeof value === 'string' ? normalizeWhitespace(value) : ''
  }

  return normalizeWhitespace(
    value
      .map((node) => {
        if (typeof node.text === 'string') {
          return node.text
        }

        if (node.type === 'variable' && typeof node.attrs?.variable === 'string') {
          return node.attrs.variable
        }

        return ''
      })
      .join(''),
  )
}

function isRawBibliographyName(value: unknown): value is RawBibliographyName {
  if (!isPlainObject(value)) {
    return false
  }

  return ['literal', 'family', 'given', 'prefix', 'suffix'].some((key) => key in value)
}

function parseBibliographyName(value: unknown): BibliographyName | null {
  if (!isRawBibliographyName(value)) {
    return null
  }

  const person = {
    family: nodeArrayToText(value.family),
    given: nodeArrayToText(value.given),
    literal: nodeArrayToText(value.literal),
    prefix: nodeArrayToText(value.prefix),
    suffix: nodeArrayToText(value.suffix),
    usePrefix: value.useprefix === true,
  } satisfies BibliographyName

  if (
    !person.literal &&
    !person.family &&
    !person.given &&
    !person.prefix &&
    !person.suffix
  ) {
    return null
  }

  return person
}

function parseBibliographyNames(value: unknown): BibliographyName[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => parseBibliographyName(item))
    .filter((item): item is BibliographyName => Boolean(item))
}

function formatBibliographyName(person: BibliographyName): string {
  if (person.literal) {
    return person.literal
  }

  const baseName = [person.given, person.prefix, person.family].filter(Boolean).join(' ').trim()

  if (!baseName) {
    return ''
  }

  return person.suffix ? `${baseName}, ${person.suffix}` : baseName
}

export function formatBibliographyNames(people: BibliographyName[]): string {
  return people.map((person) => formatBibliographyName(person)).filter(Boolean).join(', ')
}

function formatRangeItem(value: unknown): string {
  if (!Array.isArray(value)) {
    return nodeArrayToText(value)
  }

  return normalizeWhitespace(value.map((part) => nodeArrayToText(part)).filter(Boolean).join('-'))
}

function formatFieldValue(value: unknown): string {
  if (typeof value === 'string') {
    return normalizeWhitespace(value)
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (isRawBibliographyName(value)) {
    const person = parseBibliographyName(value)

    return person ? formatBibliographyName(person) : ''
  }

  if (!Array.isArray(value)) {
    return ''
  }

  if (isBibliographyNodeArray(value)) {
    return nodeArrayToText(value)
  }

  if (value.every((item) => isRawBibliographyName(item))) {
    return formatBibliographyNames(parseBibliographyNames(value))
  }

  if (value.every((item) => Array.isArray(item))) {
    return value.map((item) => formatRangeItem(item)).filter(Boolean).join(', ')
  }

  return value.map((item) => formatFieldValue(item)).filter(Boolean).join(', ')
}

function normalizeFieldMap(...groups: Array<Record<string, unknown> | undefined>): Record<string, string> {
  const result: Record<string, string> = {}

  for (const group of groups) {
    for (const [key, value] of Object.entries(group ?? {})) {
      const normalized = formatFieldValue(value)

      if (normalized) {
        result[key] = normalized
      }
    }
  }

  return result
}

function parsePartialDate(value: unknown): BibliographyPartialDate | null {
  const literal = formatFieldValue(value)

  if (!literal) {
    return null
  }

  const exactMatch = literal.match(/^(-?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/)
  const yearMatch = literal.match(/-?\d{4}/)

  return {
    day: exactMatch?.[3] ?? null,
    literal,
    month: exactMatch?.[2] ?? null,
    year: exactMatch?.[1] ?? yearMatch?.[0] ?? null,
  }
}

function firstNonEmpty(...values: string[]): string {
  return values.find((value) => value.trim().length > 0) ?? ''
}

function normalizeBibliographyEntry(entry: RawBibliographyEntry): BibliographyEntry | null {
  const citationKey = normalizeCitationKey(entry.entry_key ?? '')

  if (!citationKey) {
    return null
  }

  const fields = normalizeFieldMap(entry.fields, entry.unexpected_fields, entry.unknown_fields)
  const journalTitle = fields.journaltitle ?? ''
  const bookTitle = fields.booktitle ?? ''
  const eventTitle = fields.eventtitle ?? ''
  const seriesTitle = fields.series ?? ''
  const publisher = fields.publisher ?? ''
  const organization = fields.organization ?? ''
  const institution = fields.institution ?? ''
  const school = fields.school ?? ''
  const venue = fields.venue ?? ''

  return {
    accessed: parsePartialDate(entry.fields.urldate),
    authors: parseBibliographyNames(entry.fields.author),
    citationKey,
    containerTitle: firstNonEmpty(journalTitle, bookTitle, eventTitle, seriesTitle),
    doi: fields.doi ?? '',
    editors: parseBibliographyNames(entry.fields.editor),
    entryType: normalizeWhitespace(entry.bib_type ?? ''),
    eventTitle,
    fields,
    institution,
    issued: parsePartialDate(entry.fields.date),
    journalTitle,
    location: fields.location ?? '',
    number: fields.number ?? '',
    organization,
    pages: fields.pages ?? '',
    publisher,
    school,
    seriesTitle,
    subtitle: fields.subtitle ?? '',
    title: fields.title ?? '',
    translators: parseBibliographyNames(entry.fields.translator),
    url: fields.url ?? '',
    venue,
    volume: fields.volume ?? '',
  }
}

function formatVolumeAndNumber(entry: BibliographyEntry): string {
  if (entry.volume && entry.number) {
    return `${entry.volume}(${entry.number})`
  }

  return entry.volume || entry.number
}

function normalizeDOIHref(doi: string): string {
  return /^https?:\/\//i.test(doi) ? doi : `https://doi.org/${doi}`
}

function pushUnique(values: string[], ...nextValues: string[]) {
  for (const value of nextValues) {
    const normalized = normalizeWhitespace(value)

    if (!normalized || values.includes(normalized)) {
      continue
    }

    values.push(normalized)
  }
}

export function describeBibliographyEntry(entry: BibliographyEntry): BibliographyDisplay {
  const creatorRole = entry.authors.length
    ? 'author'
    : entry.editors.length
      ? 'editor'
      : entry.translators.length
        ? 'translator'
        : 'none'
  const creators =
    creatorRole === 'author'
      ? formatBibliographyNames(entry.authors)
      : creatorRole === 'editor'
        ? formatBibliographyNames(entry.editors)
        : creatorRole === 'translator'
          ? formatBibliographyNames(entry.translators)
          : ''
  const title = [entry.title, entry.subtitle].filter(Boolean).join(': ')
  const volumeAndNumber = formatVolumeAndNumber(entry)
  const container = entry.containerTitle
    ? [entry.containerTitle, [volumeAndNumber, entry.pages].filter(Boolean).join(', ')]
        .filter(Boolean)
        .join(' ')
    : ''
  const secondary: string[] = []

  if (!entry.containerTitle) {
    pushUnique(secondary, volumeAndNumber, entry.pages)
  }

  pushUnique(
    secondary,
    ...(entry.publisher && entry.publisher !== entry.containerTitle ? [entry.publisher] : []),
    ...(entry.organization && entry.organization !== entry.containerTitle ? [entry.organization] : []),
    ...(entry.institution && entry.institution !== entry.containerTitle ? [entry.institution] : []),
    ...(entry.school && entry.school !== entry.containerTitle ? [entry.school] : []),
    ...(entry.venue && entry.venue !== entry.containerTitle ? [entry.venue] : []),
    ...(entry.location && entry.location !== entry.containerTitle ? [entry.location] : []),
  )

  return {
    accessed: entry.accessed?.literal ?? '',
    container,
    creatorRole,
    creators,
    links: [
      ...(entry.doi
        ? [
            {
              href: normalizeDOIHref(entry.doi),
              label: 'DOI' as const,
              value: entry.doi,
            },
          ]
        : []),
      ...(entry.url
        ? [
            {
              href: entry.url,
              label: 'URL' as const,
              value: entry.url,
            },
          ]
        : []),
    ],
    secondary,
    title,
    year: entry.issued?.year ?? entry.issued?.literal ?? '',
  }
}

function cloneBibliographyName(person: BibliographyName): BibliographyName {
  return {
    family: person.family,
    given: person.given,
    literal: person.literal,
    prefix: person.prefix,
    suffix: person.suffix,
    usePrefix: person.usePrefix,
  }
}

function getUnsupportedEditableFields(entry: BibliographyEntry): string[] {
  return Object.keys(entry.fields).filter((key) => !supportedEditableFieldKeys.has(key))
}

function toEditableBibliographyEntry(entry: BibliographyEntry): EditableBibliographyEntry {
  return {
    accessed: entry.accessed?.literal ?? entry.fields.urldate ?? '',
    authors: entry.authors.map((person) => cloneBibliographyName(person)),
    bookTitle: entry.fields.booktitle ?? '',
    citationKey: entry.citationKey,
    date: entry.issued?.literal ?? entry.fields.date ?? '',
    doi: entry.doi,
    editors: entry.editors.map((person) => cloneBibliographyName(person)),
    entryType: entry.entryType,
    eventTitle: entry.eventTitle,
    institution: entry.institution,
    journalTitle: entry.journalTitle,
    location: entry.location,
    note: entry.fields.note ?? '',
    number: entry.number,
    organization: entry.organization,
    pages: entry.pages,
    publisher: entry.publisher,
    school: entry.school,
    seriesTitle: entry.seriesTitle,
    subtitle: entry.subtitle,
    title: entry.title,
    translators: entry.translators.map((person) => cloneBibliographyName(person)),
    url: entry.url,
    venue: entry.venue,
    volume: entry.volume,
  }
}

function serializeEditableBibliographyName(person: BibliographyName): string {
  if (person.literal) {
    return `{${normalizeWhitespace(person.literal)}}`
  }

  const family = [person.usePrefix ? person.prefix : '', person.family].filter(Boolean).join(' ').trim()
  const base = family
    ? [family, person.given].filter(Boolean).join(', ')
    : normalizeWhitespace([person.given, person.prefix].filter(Boolean).join(' '))

  return person.suffix ? `${base}, ${person.suffix}` : base
}

function serializeEditableBibliographyNames(people: BibliographyName[]): string {
  return people
    .map((person) => serializeEditableBibliographyName(person))
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean)
    .join(' and ')
}

function serializeEditableCitationKey(citationKey: string, entryIndex: number): string {
  return normalizeCitationKey(citationKey) || `reference-${entryIndex + 1}`
}

function serializeEditableEntryType(entryType: string): string {
  return normalizeWhitespace(entryType).toLowerCase() || 'misc'
}

function pushSerializedBibliographyField(
  lines: string[],
  fieldName: string,
  value: null | string | undefined,
) {
  const normalized = normalizeWhitespace(value ?? '')

  if (!normalized) {
    return
  }

  lines.push(`  ${fieldName} = {${normalized}},`)
}

export function parseEditableBibliography(bibtex: string): EditableBibliographyParseResult {
  if (!bibtex.trim()) {
    return {
      entries: [],
      isFullyEditable: true,
      issues: [],
    }
  }

  const entries = parseBibliography(bibtex)

  if (entries.length === 0) {
    return {
      entries: [],
      isFullyEditable: false,
      issues: ['Unable to parse bibliography source into editable entries.'],
    }
  }

  const issues: string[] = []

  for (const entry of entries) {
    if (!supportedEditableEntryTypes.has(entry.entryType)) {
      issues.push(`${entry.citationKey}: unsupported entry type "${entry.entryType || 'unknown'}"`)
    }

    const unsupportedFields = getUnsupportedEditableFields(entry)

    if (unsupportedFields.length > 0) {
      issues.push(`${entry.citationKey}: unsupported fields ${unsupportedFields.join(', ')}`)
    }
  }

  return {
    entries: entries.map((entry) => toEditableBibliographyEntry(entry)),
    isFullyEditable: issues.length === 0,
    issues,
  }
}

export function serializeEditableBibliography(entries: EditableBibliographyEntry[]): string {
  return entries
    .map((entry, entryIndex) => {
      const lines = [
        `@${serializeEditableEntryType(entry.entryType)}{${serializeEditableCitationKey(entry.citationKey, entryIndex)},`,
      ]

      pushSerializedBibliographyField(lines, 'author', serializeEditableBibliographyNames(entry.authors))
      pushSerializedBibliographyField(lines, 'editor', serializeEditableBibliographyNames(entry.editors))
      pushSerializedBibliographyField(
        lines,
        'translator',
        serializeEditableBibliographyNames(entry.translators),
      )
      pushSerializedBibliographyField(lines, 'title', entry.title)
      pushSerializedBibliographyField(lines, 'subtitle', entry.subtitle)
      pushSerializedBibliographyField(lines, 'journaltitle', entry.journalTitle)
      pushSerializedBibliographyField(lines, 'booktitle', entry.bookTitle)
      pushSerializedBibliographyField(lines, 'eventtitle', entry.eventTitle)
      pushSerializedBibliographyField(lines, 'publisher', entry.publisher)
      pushSerializedBibliographyField(lines, 'organization', entry.organization)
      pushSerializedBibliographyField(lines, 'institution', entry.institution)
      pushSerializedBibliographyField(lines, 'school', entry.school)
      pushSerializedBibliographyField(lines, 'venue', entry.venue)
      pushSerializedBibliographyField(lines, 'location', entry.location)
      pushSerializedBibliographyField(lines, 'series', entry.seriesTitle)
      pushSerializedBibliographyField(lines, 'volume', entry.volume)
      pushSerializedBibliographyField(lines, 'number', entry.number)
      pushSerializedBibliographyField(lines, 'pages', entry.pages)
      pushSerializedBibliographyField(lines, 'date', entry.date)
      pushSerializedBibliographyField(lines, 'doi', entry.doi)
      pushSerializedBibliographyField(lines, 'url', entry.url)
      pushSerializedBibliographyField(lines, 'urldate', entry.accessed)
      pushSerializedBibliographyField(lines, 'note', entry.note)

      lines.push('}')

      return lines.join('\n')
    })
    .join('\n\n')
}

export function parseBibliography(bibtex: string): BibliographyEntry[] {
  try {
    const parsedEntries = new BibLatexParser(bibtex, {
      processUnexpected: true,
      processUnknown: true,
    }).parse()

    return Object.values(parsedEntries.entries)
      .map((entry) => normalizeBibliographyEntry(entry))
      .filter((entry): entry is BibliographyEntry => Boolean(entry))
  } catch {
    return []
  }
}

export function getBibliographySource(
  value?: null | Record<string, unknown>,
): BibliographySource | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const filename = typeof value.filename === 'string' ? value.filename : null
  const source = typeof value.source === 'string' ? value.source : null

  if (!filename && !source) {
    return null
  }

  return {
    filename,
    source,
  }
}

export async function readBibliographySource(doc?: BibliographySource | null): Promise<string | null> {
  if (!doc?.source || typeof doc.source !== 'string') {
    return null
  }

  return doc.source
}

export async function loadBibliographyEntries(
  doc?: BibliographySource | null,
): Promise<BibliographyEntry[]> {
  const source = await readBibliographySource(doc)

  if (!source) {
    return []
  }

  return parseBibliography(source)
}

export function getReferencedEntries(markdown: string, entries: BibliographyEntry[]) {
  const entryMap = new Map(entries.map((entry) => [normalizeCitationKey(entry.citationKey), entry]))
  const citationKeys = extractCitationKeys(markdown)

  return {
    entries: citationKeys
      .map((key) => entryMap.get(key))
      .filter((entry): entry is BibliographyEntry => Boolean(entry)),
    missingKeys: citationKeys.filter((key) => !entryMap.has(key)),
  }
}
