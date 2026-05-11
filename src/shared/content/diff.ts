import { diffLines } from 'diff'

export type DiffLine = {
  type: 'added' | 'removed' | 'unchanged'
  value: string
}

export type VersionDiff = {
  after: string
  before: string
  field: string
  lines: DiffLine[]
}

function splitLinesPreserveTrailingNewline(value: string): string[] {
  if (!value) {
    return ['']
  }

  return value.split('\n').map((line, index, lines) => {
    const suffix = index === lines.length - 1 ? '' : '\n'

    return `${line}${suffix}`
  })
}

export function buildTextDiff(before: string, after: string): DiffLine[] {
  return diffLines(before, after).flatMap((part) => {
    const type = part.added ? 'added' : part.removed ? 'removed' : 'unchanged'

    return splitLinesPreserveTrailingNewline(part.value).map((line) => ({
      type,
      value: line,
    }))
  })
}

export function buildVersionDiff(field: string, before: string, after: string): VersionDiff {
  return {
    after,
    before,
    field,
    lines: buildTextDiff(before, after),
  }
}
