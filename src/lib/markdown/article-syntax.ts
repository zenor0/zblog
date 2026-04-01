import { nonBibliographyPrefixList, type NonBibliographyPrefix } from '@/lib/citations'

import type { ArticleElementMeta } from '@/lib/markdown/types'

const markdownImagePattern = /!\[[^\]]*]\((?:<([^>]+)>|([^\s)]+))(?:\s+(?:"[^"]*"|'[^']*'))?\)/g

export const articleSyntaxColonToken = '__zblog_colon__'

const articleReferenceKindPattern = nonBibliographyPrefixList.join('|')
const articleReferenceMarkerPattern = new RegExp(`(${articleReferenceKindPattern}):`, 'gi')

export const articleLabelPattern = /^\s*\{#([^}\s]+)\}\s*$/
export const citationPattern = /\[@([^\]]+)\]/g

const articleReferenceLabels: Record<NonBibliographyPrefix, string> = {
  alg: 'Algorithm',
  app: 'Appendix',
  cor: 'Corollary',
  def: 'Definition',
  eq: 'Equation',
  ex: 'Example',
  fig: 'Figure',
  lem: 'Lemma',
  lst: 'Listing',
  prop: 'Proposition',
  sec: 'Section',
  tbl: 'Table',
  thm: 'Theorem',
}

export function extractMarkdownMediaSources(markdown: string): string[] {
  const seen = new Set<string>()

  for (const match of markdown.matchAll(markdownImagePattern)) {
    const source = (match[1] ?? match[2] ?? '').trim()

    if (!source || seen.has(source)) {
      continue
    }

    seen.add(source)
  }

  return Array.from(seen)
}

function isArticleReferencePrefix(value: string): value is NonBibliographyPrefix {
  return nonBibliographyPrefixList.includes(value as NonBibliographyPrefix)
}

export function decodePreparedValue(value: string) {
  return value.replaceAll(articleSyntaxColonToken, ':')
}

export function prepareMarkdownSource(source: string) {
  const lines = source.split(/\r?\n/)
  let activeFence: null | string = null

  return lines
    .map((line) => {
      const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/)

      if (fenceMatch) {
        const marker = fenceMatch[1][0]

        if (!activeFence) {
          activeFence = marker
        } else if (activeFence === marker) {
          activeFence = null
        }

        return line
      }

      if (activeFence) {
        return line
      }

      const escapedCitations = line.replace(citationPattern, (_match, rawGroup: string) => {
        const escapedGroup = rawGroup.replace(articleReferenceMarkerPattern, `$1${articleSyntaxColonToken}`)

        return `[@${escapedGroup}]`
      })

      return escapedCitations.replace(
        /\{#([a-z0-9_-]+):([^}\s]+)\}/gi,
        `{#$1${articleSyntaxColonToken}$2}`,
      )
    })
    .join('\n')
}

export function extractNodeText(node: any): string {
  if (!node) {
    return ''
  }

  if (typeof node.value === 'string') {
    return node.value
  }

  if (!Array.isArray(node.children)) {
    return ''
  }

  return node.children.map((child: any) => extractNodeText(child)).join('')
}

export function parseArticleLabel(value: string): null | { kind: NonBibliographyPrefix; label: string } {
  const decoded = decodePreparedValue(value).trim().replace(/^#/, '')
  const [prefix] = decoded.split(':')

  if (!decoded || !prefix || !isArticleReferencePrefix(prefix)) {
    return null
  }

  return {
    kind: prefix,
    label: decoded.toLowerCase(),
  }
}

export function formatArticleReference(meta: Pick<ArticleElementMeta, 'kind' | 'number'>) {
  return `${articleReferenceLabels[meta.kind]} ${meta.number}`
}

export function createArticleAnchorId(label: string) {
  const slug = label.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  return `ref-${slug || 'article-reference'}`
}
