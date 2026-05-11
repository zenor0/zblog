const citationGroupPattern = /\[@([^\]]+)\]/g
export const nonBibliographyPrefixList = [
  'alg',
  'app',
  'cor',
  'def',
  'eq',
  'ex',
  'fig',
  'lem',
  'lst',
  'prop',
  'sec',
  'tbl',
  'thm',
 ] as const

export type NonBibliographyPrefix = (typeof nonBibliographyPrefixList)[number]

const nonBibliographyPrefixes = new Set<string>(nonBibliographyPrefixList)

export type CitationReference =
  | {
      key: string
      kind: 'article'
      prefix: NonBibliographyPrefix
    }
  | {
      key: string
      kind: 'bibliography'
    }

export function normalizeCitationKey(value: string): string {
  return value.trim().replace(/^@/, '').trim().toLowerCase()
}

export function isBibliographyCitationKey(value: string): boolean {
  const normalized = normalizeCitationKey(value)
  const [prefix] = normalized.split(':')

  return Boolean(normalized) && !nonBibliographyPrefixes.has(prefix)
}

export function parseCitationGroup(value: string): string[] {
  return parseCitationReferences(value)
    .filter((item): item is Extract<CitationReference, { kind: 'bibliography' }> => item.kind === 'bibliography')
    .map((item) => item.key)
}

export function parseCitationReferences(value: string): CitationReference[] {
  return value
    .split(';')
    .map((item) => normalizeCitationKey(item))
    .filter(Boolean)
    .map((item) => {
      if (isBibliographyCitationKey(item)) {
        return {
          key: item,
          kind: 'bibliography',
        } satisfies CitationReference
      }

      const [prefix] = item.split(':')

      return {
        key: item,
        kind: 'article',
        prefix: prefix as NonBibliographyPrefix,
      } satisfies CitationReference
    })
}

export function extractCitationGroups(markdown: string): string[][] {
  return Array.from(markdown.matchAll(citationGroupPattern), (match) => parseCitationGroup(match[1] ?? ''))
}

export function extractCitationKeys(markdown: string): string[] {
  const seen = new Set<string>()

  for (const group of extractCitationGroups(markdown)) {
    for (const key of group) {
      seen.add(key)
    }
  }

  return Array.from(seen)
}

export function buildCitationIndex(markdown: string): Map<string, number> {
  return new Map(extractCitationKeys(markdown).map((key, index) => [key, index + 1]))
}
