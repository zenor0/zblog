import fs from 'fs/promises'
import path from 'path'

import bibtexParse from 'bibtex-parse-js'

import { extractCitationKeys, normalizeCitationKey } from '@/lib/citations'
import { bibliographyUploadDir } from '@/lib/uploads'

type RawBibliographyEntry = {
  citationKey?: string
  entryType?: string
  entryTags?: Record<string, string>
}

type BibliographyFileLike = {
  filename?: string | null
  source?: string | null
}

export type BibliographyEntry = {
  authors: string
  citationKey: string
  entryType: string
  formatted: string
  rawTags: Record<string, string>
  title: string
  venue: string
  year: string
}

function normalizeEntryTags(entryTags: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entryTags ?? {}).map(([key, value]) => [key.toLowerCase(), value.trim()]),
  )
}

function formatAuthorName(author: string): string {
  const trimmed = author.trim()

  if (!trimmed) {
    return ''
  }

  if (trimmed.includes(',')) {
    const [family, given] = trimmed.split(',').map((segment) => segment.trim())

    return [given, family].filter(Boolean).join(' ')
  }

  return trimmed
}

function formatAuthors(authorField: string | undefined): string {
  if (!authorField) {
    return 'Unknown author'
  }

  const authors = authorField
    .split(/\s+and\s+/i)
    .map((author) => formatAuthorName(author))
    .filter(Boolean)

  if (authors.length === 0) {
    return 'Unknown author'
  }

  if (authors.length === 1) {
    return authors[0]
  }

  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`
  }

  return `${authors.slice(0, -1).join(', ')}, and ${authors[authors.length - 1]}`
}

function formatVenue(tags: Record<string, string>): string {
  return (
    tags.journal ||
    tags.booktitle ||
    tags.publisher ||
    tags.school ||
    tags.organization ||
    tags.howpublished ||
    ''
  )
}

function formatReference(tags: Record<string, string>): string {
  const authors = formatAuthors(tags.author)
  const year = tags.year || 'n.d.'
  const title = tags.title || 'Untitled work'
  const venue = formatVenue(tags)
  const pages = tags.pages ? `, pp. ${tags.pages}` : ''
  const volume = tags.volume ? `, vol. ${tags.volume}` : ''
  const number = tags.number ? `(${tags.number})` : ''
  const doi = tags.doi ? ` DOI: ${tags.doi}.` : ''
  const venueSegment = venue ? ` ${venue}${volume}${number}${pages}.` : ''

  return `${authors} (${year}). ${title}.${venueSegment}${doi}`.replace(/\s+/g, ' ').trim()
}

export function parseBibliography(bibtex: string): BibliographyEntry[] {
  const parsedEntries = (bibtexParse.toJSON(bibtex) as RawBibliographyEntry[]) ?? []

  return parsedEntries
    .map((entry) => {
      const rawTags = normalizeEntryTags(entry.entryTags)
      const citationKey = normalizeCitationKey(entry.citationKey ?? '')

      if (!citationKey) {
        return null
      }

      return {
        authors: formatAuthors(rawTags.author),
        citationKey,
        entryType: (entry.entryType ?? '').toLowerCase(),
        formatted: formatReference(rawTags),
        rawTags,
        title: rawTags.title || 'Untitled work',
        venue: formatVenue(rawTags),
        year: rawTags.year || 'n.d.',
      } satisfies BibliographyEntry
    })
    .filter((entry): entry is BibliographyEntry => Boolean(entry))
}

export async function readBibliographySource(doc?: BibliographyFileLike | null): Promise<string | null> {
  if (!doc?.source || typeof doc.source !== 'string') {
    if (!doc?.filename) {
      return null
    }

    const legacyFilePath = path.join(bibliographyUploadDir, doc.filename)

    try {
      return await fs.readFile(legacyFilePath, 'utf8')
    } catch {
      return null
    }
  }

  return doc.source
}

export async function loadBibliographyEntries(
  doc?: BibliographyFileLike | null,
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
