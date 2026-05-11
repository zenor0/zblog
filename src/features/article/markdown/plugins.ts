import { findAndReplace } from 'mdast-util-find-and-replace'
import { visit } from 'unist-util-visit'

import { parseCitationReferences } from '@/features/article/model/citations'
import {
  buildArticleElementProperties,
  parseFigureParagraph,
  parseTableCaptionParagraph,
  registerArticleElement,
} from '@/features/article/markdown/article-elements'
import {
  citationPattern,
  decodeComponentAttributeValue,
  decodePreparedValue,
  extractNodeText,
  formatArticleReference,
} from '@/features/article/markdown/article-syntax'
import { findMarkdownComponentByDirectiveName } from '@/features/article/markdown/component-registry'
import type { ArticleElementMeta, MarkdownRendererProps } from '@/features/article/markdown/types'

const knownCalloutKinds = new Set(['note', 'tip', 'important', 'warning', 'caution'])
const calloutMarkerPattern = /^\s*\[!([^\]]+)\](?:[ \t]*\n?)?/i

function formatCalloutLabel(value: string) {
  return value
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeCalloutMetadata(rawLabel: string) {
  const normalizedLabel = rawLabel.trim().toLowerCase().replace(/\s+/g, ' ')

  if (!normalizedLabel) {
    return null
  }

  return {
    displayLabel: formatCalloutLabel(normalizedLabel),
    kind: normalizedLabel,
    variant: knownCalloutKinds.has(normalizedLabel) ? normalizedLabel : 'custom',
  }
}

function nodeHasContent(node: any): boolean {
  if (!node) {
    return false
  }

  if (node.type === 'text') {
    return typeof node.value === 'string' && node.value.length > 0
  }

  if (!Array.isArray(node.children)) {
    return true
  }

  return node.children.some((child: any) => nodeHasContent(child))
}

function consumeLeadingText(nodes: any[], remaining: number): { nodes: any[]; remaining: number } {
  const nextNodes: any[] = []
  let remainingCharacters = remaining

  for (const node of nodes) {
    if (remainingCharacters <= 0) {
      nextNodes.push(node)
      continue
    }

    if (node?.type === 'text' && typeof node.value === 'string') {
      if (node.value.length <= remainingCharacters) {
        remainingCharacters -= node.value.length
        continue
      }

      nextNodes.push({
        ...node,
        value: node.value.slice(remainingCharacters),
      })
      remainingCharacters = 0
      continue
    }

    if (Array.isArray(node?.children)) {
      const result = consumeLeadingText(node.children, remainingCharacters)

      remainingCharacters = result.remaining

      if (result.nodes.length > 0) {
        nextNodes.push({
          ...node,
          children: result.nodes,
        })
      }

      continue
    }

    nextNodes.push(node)
  }

  return {
    nodes: nextNodes.filter((node) => nodeHasContent(node)),
    remaining: remainingCharacters,
  }
}

export function githubCalloutBlockquotePlugin() {
  return (tree: unknown) => {
    visit(tree as any, 'blockquote', (node: any) => {
      const firstChild = Array.isArray(node?.children) ? node.children[0] : null

      if (firstChild?.type !== 'paragraph') {
        return
      }

      const firstParagraphText = extractNodeText(firstChild)
      const match = firstParagraphText.match(calloutMarkerPattern)

      if (!match?.[0] || !match[1]) {
        return
      }

      const metadata = normalizeCalloutMetadata(match[1])

      if (!metadata) {
        return
      }

      const updatedChildren = consumeLeadingText(firstChild.children ?? [], match[0].length)
      const remainingParagraph = {
        ...firstChild,
        children: updatedChildren.nodes,
      }
      const blockquoteChildren = [...(node.children ?? [])]

      if (nodeHasContent(remainingParagraph)) {
        blockquoteChildren[0] = remainingParagraph
      } else {
        blockquoteChildren.shift()
      }

      const data = node.data || (node.data = {})

      data.hName = 'aside'
      data.hProperties = {
        className: ['md-callout', `md-callout--${metadata.variant}`],
        'data-callout-label': metadata.displayLabel,
        'data-kind': metadata.kind,
      }

      node.children = blockquoteChildren
    })
  }
}

export function articleElementsPlugin() {
  return (tree: any) => {
    const registry = new Map<string, ArticleElementMeta>()
    const counters = new Map()
    const rootData = tree.data || (tree.data = {})
    const children = Array.isArray(tree.children) ? tree.children : []

    for (let index = 0; index < children.length; index += 1) {
      const node = children[index]

      if (node?.type === 'paragraph') {
        const figure = parseFigureParagraph(node)

        if (figure) {
          const articleElement = registerArticleElement({
            counters,
            kind: 'fig',
            label: figure.label,
            registry,
          })

          node.children = [figure.imageNode]
          node.data = {
            ...(node.data ?? {}),
            hProperties: {
              ...(node.data?.hProperties ?? {}),
              ...buildArticleElementProperties(articleElement),
            },
          }
          continue
        }
      }

      if (node?.type === 'table') {
        const caption = parseTableCaptionParagraph(children[index + 1])

        if (caption) {
          const articleElement = registerArticleElement({
            caption: caption.caption,
            counters,
            kind: 'tbl',
            label: caption.label,
            registry,
          })

          node.data = {
            ...(node.data ?? {}),
            hProperties: {
              ...(node.data?.hProperties ?? {}),
              ...buildArticleElementProperties(articleElement),
            },
          }
          children.splice(index + 1, 1)
        }
      }
    }

    rootData.articleElementRegistry = registry
  }
}

export function markdownComponentDirectivePlugin() {
  return (tree: unknown) => {
    visit(tree as any, (node: any) => {
      if (
        (node.type !== 'containerDirective' && node.type !== 'leafDirective') ||
        !findMarkdownComponentByDirectiveName(node.name)
      ) {
        return
      }

      const attributes = Object.fromEntries(
        Object.entries(node.attributes ?? {}).map(([key, value]) => [
          key,
          typeof value === 'string' ? decodeComponentAttributeValue(value) : value,
        ]),
      )
      const data = node.data || (node.data = {})

      data.hName = node.name
      data.hProperties = {
        ...(data.hProperties ?? {}),
        ...attributes,
      }
    })
  }
}

export function citationPlugin(
  options: Pick<MarkdownRendererProps, 'articleReferenceLabels' | 'citationIndex'> = {},
) {
  const citationIndex = options.citationIndex ?? new Map<string, number>()
  const articleReferenceLabels = options.articleReferenceLabels ?? {}

  return (tree: any) => {
    const articleElementRegistry =
      tree?.data?.articleElementRegistry instanceof Map
        ? (tree.data.articleElementRegistry as Map<string, ArticleElementMeta>)
        : new Map<string, ArticleElementMeta>()

    findAndReplace(tree as any, [
      [
        citationPattern,
        (_match: string, rawGroup: string) => {
          const references = parseCitationReferences(decodePreparedValue(rawGroup))

          if (references.length === 0) {
            return _match
          }

          const nodes: any[] = [
            {
              type: 'text',
              value: '[',
            },
          ]

          references.forEach((reference, index) => {
            if (reference.kind === 'bibliography') {
              const citationNumber = citationIndex.get(reference.key)

              if (citationNumber) {
                nodes.push({
                  children: [
                    {
                      type: 'text',
                      value: String(citationNumber),
                    },
                  ],
                  data: {
                    hProperties: {
                      className: ['citation-link'],
                      'data-link-preview-key': reference.key,
                      'data-link-preview-kind': 'bibliography',
                    },
                  },
                  type: 'link',
                  url: `#reference-${citationNumber}`,
                })
              } else {
                nodes.push({
                  type: 'text',
                  value: '?',
                })
              }
            } else {
              const articleElement = articleElementRegistry.get(reference.key)

              if (articleElement?.anchorId) {
                const label = formatArticleReference(articleElement, articleReferenceLabels)

                nodes.push({
                  children: [
                    {
                      type: 'text',
                      value: label,
                    },
                  ],
                  data: {
                    hProperties: {
                      className: ['citation-link'],
                      'data-link-preview-description': articleElement.caption ?? undefined,
                      'data-link-preview-kind': 'articleElement',
                      'data-link-preview-meta': `${articleElement.kind.toUpperCase()} reference`,
                      'data-link-preview-subtitle': 'Article reference',
                      'data-link-preview-title': label,
                    },
                  },
                  type: 'link',
                  url: `#${articleElement.anchorId}`,
                })
              } else {
                nodes.push({
                  children: [
                    {
                      type: 'text',
                      value: `@${reference.key}`,
                    },
                  ],
                  data: {
                    hName: 'span',
                    hProperties: {
                      className: ['citation-link', 'citation-link--missing'],
                    },
                  },
                  type: 'strong',
                })
              }
            }

            if (index < references.length - 1) {
              nodes.push({
                type: 'text',
                value: '; ',
              })
            }
          })

          nodes.push({
            type: 'text',
            value: ']',
          })

          return nodes
        },
      ],
    ])
  }
}
