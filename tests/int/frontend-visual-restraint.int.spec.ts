import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function collectFiles(directory: string, extensions: Set<string>): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry)
    const stat = statSync(absolutePath)

    if (stat.isDirectory()) {
      return collectFiles(absolutePath, extensions)
    }

    return extensions.has(path.extname(entry)) ? [absolutePath] : []
  })
}

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('frontend visual restraint', () => {
  it('does not hard-code Tailwind tracking utilities in frontend and shared UI code', () => {
    const scannedFiles = [
      ...collectFiles(path.join(projectRoot, 'src/app/(frontend)'), new Set(['.css', '.tsx'])),
      ...collectFiles(path.join(projectRoot, 'src/components/frontend'), new Set(['.tsx'])),
      ...collectFiles(path.join(projectRoot, 'src/components/ui'), new Set(['.tsx'])),
    ]
    const trackingUtilities: string[] = []

    for (const absolutePath of scannedFiles) {
      const source = readFileSync(absolutePath, 'utf8')
      const relativePath = path.relative(projectRoot, absolutePath)

      for (const match of source.matchAll(
        /(?:^|[\s'"])(tracking-(?:\[[^\]]+\]|tight|tighter|normal|wide|wider|widest))(?=[\s'"]|$)/g,
      )) {
        trackingUtilities.push(`${relativePath}: ${match[1]}`)
      }
    }

    expect(trackingUtilities).toEqual([])
  })

  it('does not give shared UI surfaces default shadows', () => {
    const scannedFiles = collectFiles(
      path.join(projectRoot, 'src/components/ui'),
      new Set(['.tsx']),
    )
    const shadowUtilities: string[] = []

    for (const absolutePath of scannedFiles) {
      const source = readFileSync(absolutePath, 'utf8')
      const relativePath = path.relative(projectRoot, absolutePath)

      for (const match of source.matchAll(/shadow-(?:xs|sm|md|lg|xl|2xl)/g)) {
        shadowUtilities.push(`${relativePath}: ${match[0]}`)
      }
    }

    expect(shadowUtilities).toEqual([])
  })

  it('defines restrained tracking tokens for recurring editorial labels', () => {
    const styles = readProjectFile('src/app/(frontend)/styles.css')

    expect(styles).toContain('--zblog-tracking-meta: 0.08em;')
    expect(styles).toContain('--zblog-tracking-badge: 0.04em;')
    expect(styles).toContain('--zblog-tracking-label: 0.06em;')
  })

  it('defines a compact typography scale for dense interface text', () => {
    const styles = readProjectFile('src/app/(frontend)/styles.css')

    expect(styles).toContain('--zblog-type-body-size: 1rem;')
    expect(styles).toContain('--zblog-type-caption-size: 0.8125rem;')
    expect(styles).toContain('--zblog-type-control-size: 0.8125rem;')
    expect(styles).toContain('--zblog-type-meta-size: 0.6875rem;')
    expect(styles).toContain('--zblog-type-badge-size: 0.625rem;')
  })

  it('defines restrained code font and syntax tokens for article code blocks', () => {
    const styles = readProjectFile('src/app/(frontend)/styles.css')

    expect(styles).toMatch(/--zblog-code-font-family:\s*var\(--font-code\)/)
    expect(styles).toContain('--zblog-syntax-keyword:')
    expect(styles).toContain('--zblog-syntax-string:')
    expect(styles).toContain('.markdown-codeblock .hljs-keyword')
    expect(styles).toContain('.markdown-codeblock .hljs-string')
    expect(styles).not.toMatch(/\.markdown-codeblock\s*\{[^}]*shadow-/s)
  })

  it('keeps badges below body scale in shared and editorial UI', () => {
    const badgeComponent = readProjectFile('src/components/ui/badge.tsx')
    const styles = readProjectFile('src/app/(frontend)/styles.css')

    expect(badgeComponent).toContain('text-[10px]')
    expect(badgeComponent).not.toMatch(/text-(?:xs|sm|base)/)
    expect(styles).toContain('font-size: var(--zblog-type-badge-size);')
    expect(styles).toContain('font-size: var(--zblog-type-meta-size);')
  })

  it('avoids heavy default weights in shared UI components', () => {
    const scannedFiles = collectFiles(
      path.join(projectRoot, 'src/components/ui'),
      new Set(['.tsx']),
    )
    const heavyWeights: string[] = []

    for (const absolutePath of scannedFiles) {
      const source = readFileSync(absolutePath, 'utf8')
      const relativePath = path.relative(projectRoot, absolutePath)

      for (const match of source.matchAll(/font-(?:semibold|bold|extrabold|black)/g)) {
        heavyWeights.push(`${relativePath}: ${match[0]}`)
      }
    }

    expect(heavyWeights).toEqual([])
  })

  it('uses explicit compact sizes instead of broad Tailwind type steps in shared UI', () => {
    const scannedFiles = collectFiles(
      path.join(projectRoot, 'src/components/ui'),
      new Set(['.tsx']),
    )
    const broadTypeSteps: string[] = []

    for (const absolutePath of scannedFiles) {
      const source = readFileSync(absolutePath, 'utf8')
      const relativePath = path.relative(projectRoot, absolutePath)

      for (const match of source.matchAll(/text-(?:xs|sm|base|lg|xl)/g)) {
        broadTypeSteps.push(`${relativePath}: ${match[0]}`)
      }
    }

    expect(broadTypeSteps).toEqual([])
  })

  it('keeps display typography below oversized hero steps', () => {
    const scannedFiles = [
      ...collectFiles(path.join(projectRoot, 'src/app/(frontend)'), new Set(['.css', '.tsx'])),
      ...collectFiles(path.join(projectRoot, 'src/components/frontend'), new Set(['.tsx'])),
    ]
    const oversizedSteps: string[] = []

    for (const absolutePath of scannedFiles) {
      const source = readFileSync(absolutePath, 'utf8')
      const relativePath = path.relative(projectRoot, absolutePath)

      for (const match of source.matchAll(/(?:text-\[5\.5rem\]|text-[789]xl)/g)) {
        oversizedSteps.push(`${relativePath}: ${match[0]}`)
      }
    }

    expect(oversizedSteps).toEqual([])
  })
})
