const citationGroupPattern = /\[@([^\]]+)\]/g
const nonBibliographyPrefixes = new Set([
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
])

export function normalizeCitationKey(value: string): string {
  return value.trim().replace(/^@/, '').trim().toLowerCase()
}

export function isBibliographyCitationKey(value: string): boolean {
  const normalized = normalizeCitationKey(value)
  const [prefix] = normalized.split(':')

  return Boolean(normalized) && !nonBibliographyPrefixes.has(prefix)
}

export function parseCitationGroup(value: string): string[] {
  return value
    .split(';')
    .map((item) => normalizeCitationKey(item))
    .filter((item) => isBibliographyCitationKey(item))
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
