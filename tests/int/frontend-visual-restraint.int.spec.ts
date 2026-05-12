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

function isLocalCssImport(importPath: string) {
  return importPath.startsWith('.')
}

function readFrontendStyles(
  relativePath = 'src/app/(frontend)/styles.css',
  seen = new Set<string>(),
): string {
  if (seen.has(relativePath)) {
    return ''
  }

  seen.add(relativePath)

  const source = readProjectFile(relativePath)
  const importMatches = [...source.matchAll(/@import ['"]([^'"]+\.css)['"];/g)].map(
    (match) => match[1] ?? '',
  )
  const importedSource = importMatches
    .filter(isLocalCssImport)
    .map((importPath) =>
      readFrontendStyles(
        path.normalize(path.join(path.dirname(relativePath), importPath)).replaceAll(path.sep, '/'),
        seen,
      ),
    )
    .join('\n')

  return [source, importedSource].filter(Boolean).join('\n')
}

function collectFrontendCodeFiles(extensions: Set<string>) {
  return [
    ...collectFiles(path.join(projectRoot, 'src/app/(frontend)'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/features/article/ui'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/features/media/ui'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/features/post-views/ui'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/features/posts/ui'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/features/site-settings/ui'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/shared/theme'), extensions),
    ...collectFiles(path.join(projectRoot, 'src/shared/ui'), extensions),
  ]
}

describe('frontend visual restraint', () => {
  it('does not hard-code Tailwind tracking utilities in frontend and shared UI code', () => {
    const scannedFiles = [
      ...collectFrontendCodeFiles(new Set(['.css', '.tsx'])),
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
    const styles = readFrontendStyles()

    expect(styles).toContain('--zblog-tracking-meta: 0;')
    expect(styles).toContain('--zblog-tracking-badge: 0;')
    expect(styles).toContain('--zblog-tracking-label: 0;')
  })

  it('defines a compact typography scale for dense interface text', () => {
    const styles = readFrontendStyles()

    expect(styles).toContain('--zblog-type-body-size: 1rem;')
    expect(styles).toContain('--zblog-type-caption-size: 0.8125rem;')
    expect(styles).toContain('--zblog-type-control-size: 0.8125rem;')
    expect(styles).toContain('--zblog-type-meta-size: 0.6875rem;')
    expect(styles).toContain('--zblog-type-badge-size: 0.625rem;')
  })

  it('defines restrained code font and syntax tokens for article code blocks', () => {
    const styles = readFrontendStyles()

    expect(styles).toMatch(/--zblog-code-font-family:\s*var\(--font-code,\s*'JetBrains Mono'\)/)
    expect(styles).toContain('--zblog-codeblock-background: #111318;')
    expect(styles).toContain('background: var(--zblog-codeblock-background);')
    expect(styles).toContain('--zblog-syntax-keyword:')
    expect(styles).toContain('--zblog-syntax-string:')
    expect(styles).toContain('.markdown-codeblock .hljs-keyword')
    expect(styles).toContain('.markdown-codeblock .hljs-string')
    expect(styles).toContain('.markdown-codeblock .hljs-selector-class')
    expect(styles).not.toMatch(/\.markdown-codeblock\s*\{[^}]*shadow-/s)
  })

  it('uses theme-aware surface tokens for semantic article blocks', () => {
    const styles = readFrontendStyles()
    const noticeCard = readProjectFile('src/features/article/ui/markdown-components/NoticeCard.tsx')
    const featureGrid = readProjectFile(
      'src/features/article/ui/markdown-components/FeatureGrid.tsx',
    )
    const lightOnlySemanticUtilities =
      /\b(?:bg|text|border|border-l)-(?:sky|emerald|fuchsia|amber|red|slate)-(?:50|100|200|300|400|700|800|900|950)(?:\/\d+)?\b/

    expect(styles).toContain("@import '../../styles/frontend/article-block-surfaces.css';")
    expect(styles).toContain('--zblog-article-surface-info-accent')
    expect(styles).toContain('.md-callout--note')
    expect(styles).toContain('.article-notice-card')
    expect(styles).not.toMatch(lightOnlySemanticUtilities)
    expect(noticeCard).toContain('article-notice-card article-semantic-surface')
    expect(noticeCard).not.toMatch(lightOnlySemanticUtilities)
    expect(featureGrid).toContain('article-feature-grid-card')
  })

  it('keeps badges below body scale in shared and editorial UI', () => {
    const badgeComponent = readProjectFile('src/components/ui/badge.tsx')
    const styles = readFrontendStyles()

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
    const scannedFiles = [...collectFrontendCodeFiles(new Set(['.css', '.tsx']))]
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
