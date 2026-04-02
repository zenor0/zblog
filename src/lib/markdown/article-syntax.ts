import { nonBibliographyPrefixList, type NonBibliographyPrefix } from '@/lib/citations'

import { findMarkdownComponentByJsxTag } from '@/lib/markdown/component-registry'
import type { ArticleElementMeta } from '@/lib/markdown/types'

const markdownImagePattern = /!\[[^\]]*]\((?:<([^>]+)>|([^\s)]+))(?:\s+(?:"[^"]*"|'[^']*'))?\)/g

export const articleSyntaxColonToken = '__zblog_colon__'

const articleReferenceKindPattern = nonBibliographyPrefixList.join('|')
const articleReferenceMarkerPattern = new RegExp(`(${articleReferenceKindPattern}):`, 'gi')

export const articleLabelPattern = /^\s*\{#([^}\s]+)\}\s*$/
export const citationPattern = /\[@([^\]]+)\]/g
const componentEncodingPrefix = '__zblog_component__'

const defaultArticleReferenceLabels: Record<NonBibliographyPrefix, string> = {
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

function encodeComponentAttributeValue(value: string) {
  return `${componentEncodingPrefix}${encodeURIComponent(value)}`
}

export function decodeComponentAttributeValue(value: string) {
  if (!value.startsWith(componentEncodingPrefix)) {
    return value
  }

  return decodeURIComponent(value.slice(componentEncodingPrefix.length))
}

function parseJSXLikeAttributes(value: string) {
  const attributes = new Map<string, string>()
  const attributePattern =
    /([A-Za-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}|([^\s]+))/g

  for (const match of value.matchAll(attributePattern)) {
    const name = match[1]
    const rawValue = match[2] ?? match[3] ?? match[4] ?? match[5] ?? ''

    attributes.set(name, rawValue)
  }

  return attributes
}

function buildDirectiveAttributes(attributes: Map<string, string>) {
  if (attributes.size === 0) {
    return ''
  }

  return `{${Array.from(attributes.entries())
    .map(([name, value]) => `${name}="${encodeComponentAttributeValue(value)}"`)
    .join(' ')}}`
}

function transformComponentTagLine(line: string) {
  const trimmed = line.trim()
  const selfClosingMatch = trimmed.match(/^<([A-Z][A-Za-z0-9]*)\s*([^>]*)\/>$/)

  if (selfClosingMatch) {
    const component = findMarkdownComponentByJsxTag(selfClosingMatch[1])

    if (!component) {
      return null
    }

    const attributes = buildDirectiveAttributes(parseJSXLikeAttributes(selfClosingMatch[2] ?? ''))

    return `${line.slice(0, line.indexOf('<'))}::${component.directiveName}${attributes}`
  }

  const openingMatch = trimmed.match(/^<([A-Z][A-Za-z0-9]*)\s*([^>]*)>$/)

  if (openingMatch) {
    const component = findMarkdownComponentByJsxTag(openingMatch[1])

    if (!component) {
      return null
    }

    const attributes = buildDirectiveAttributes(parseJSXLikeAttributes(openingMatch[2] ?? ''))

    return `${line.slice(0, line.indexOf('<'))}:::${component.directiveName}${attributes}`
  }

  const closingMatch = trimmed.match(/^<\/([A-Z][A-Za-z0-9]*)>$/)

  if (closingMatch && findMarkdownComponentByJsxTag(closingMatch[1])) {
    return `${line.slice(0, line.indexOf('<'))}:::`
  }

  return null
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

      const transformedComponentLine = transformComponentTagLine(line)

      if (transformedComponentLine) {
        return transformedComponentLine
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

export function formatArticleReference(
  meta: Pick<ArticleElementMeta, 'kind' | 'number'>,
  labels: Partial<Record<NonBibliographyPrefix, string>> = {},
) {
  const label = labels[meta.kind] ?? defaultArticleReferenceLabels[meta.kind]

  return `${label} ${meta.number}`
}

export function createArticleAnchorId(label: string) {
  const slug = label.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  return `ref-${slug || 'article-reference'}`
}
