import { findAndReplace } from 'mdast-util-find-and-replace'
import { visit } from 'unist-util-visit'

import { parseCitationReferences } from '@/lib/citations'
import {
  buildArticleElementProperties,
  parseFigureParagraph,
  parseTableCaptionParagraph,
  registerArticleElement,
} from '@/lib/markdown/article-elements'
import { citationPattern, decodePreparedValue, formatArticleReference } from '@/lib/markdown/article-syntax'
import type { ArticleElementMeta } from '@/lib/markdown/types'

const calloutKinds = new Set(['note', 'tip', 'warning', 'info'])

export function calloutDirectivePlugin() {
  return (tree: unknown) => {
    visit(tree as any, (node: any) => {
      if (
        (node.type !== 'containerDirective' && node.type !== 'leafDirective') ||
        !calloutKinds.has(node.name)
      ) {
        return
      }

      const data = node.data || (node.data = {})

      data.hName = 'aside'
      data.hProperties = {
        className: ['md-callout', `md-callout--${node.name}`],
        'data-kind': node.name,
      }
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

export function citationPlugin(options: { citationIndex?: Map<string, number> } = {}) {
  const citationIndex = options.citationIndex ?? new Map<string, number>()

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
                nodes.push({
                  children: [
                    {
                      type: 'text',
                      value: formatArticleReference(articleElement),
                    },
                  ],
                  data: {
                    hProperties: {
                      className: ['citation-link'],
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
