export type MarkdownHeading = {
  depth: number
  displayNumber?: string
  id: string
  text: string
}

function normalizeHeadingText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\\([\\`*{}\[\]()#+\-.!_>])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function createHeadingID(text: string, seen: Map<string, number>) {
  const base = slugifyHeading(text) || 'section'
  const nextCount = (seen.get(base) ?? 0) + 1
  seen.set(base, nextCount)

  return nextCount === 1 ? base : `${base}-${nextCount}`
}

function createHeadingDisplayNumber(depth: number, counters: number[]) {
  if (depth === 1) {
    counters.fill(0)
    return undefined
  }

  if (depth < 2 || depth > 4) {
    return undefined
  }

  for (let level = 2; level < depth; level += 1) {
    if (counters[level] === 0) {
      counters[level] = 1
    }
  }

  counters[depth] = (counters[depth] ?? 0) + 1

  for (let level = depth + 1; level <= 4; level += 1) {
    counters[level] = 0
  }

  return Array.from({ length: depth - 1 }, (_, index) => counters[index + 2]).join('.')
}

function createHeading(
  depth: number,
  text: string,
  seenIDs: Map<string, number>,
  counters: number[],
) {
  const displayNumber = createHeadingDisplayNumber(depth, counters)

  return {
    ...(displayNumber ? { displayNumber } : {}),
    depth,
    id: createHeadingID(text, seenIDs),
    text,
  }
}

export function extractMarkdownHeadings(source: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const displayNumberCounters = [0, 0, 0, 0, 0]
  const seenIDs = new Map<string, number>()
  const lines = source.split(/\r?\n/)
  let activeFence: null | string = null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/)

    if (fenceMatch) {
      const marker = fenceMatch[1]

      if (!activeFence) {
        activeFence = marker[0]
      } else if (activeFence === marker[0]) {
        activeFence = null
      }

      continue
    }

    if (activeFence) {
      continue
    }

    const atxMatch = line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/)

    if (atxMatch) {
      const text = normalizeHeadingText(atxMatch[2])

      if (text) {
        headings.push(createHeading(atxMatch[1].length, text, seenIDs, displayNumberCounters))
      }

      continue
    }

    const currentText = normalizeHeadingText(line)
    const underline = lines[index + 1]?.match(/^ {0,3}(=+|-+)\s*$/)

    if (!currentText || !underline) {
      continue
    }

    headings.push(
      createHeading(
        underline[1][0] === '=' ? 1 : 2,
        currentText,
        seenIDs,
        displayNumberCounters,
      ),
    )
    index += 1
  }

  return headings
}
