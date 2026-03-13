import { findAndReplace } from 'mdast-util-find-and-replace'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

import { parseCitationGroup } from '@/lib/citations'

type MarkdownRendererProps = {
  citationIndex?: Map<string, number>
  source: string
}

const citationPattern = /\[@([^\]]+)\]/g
const calloutKinds = new Set(['note', 'tip', 'warning', 'info'])

function calloutDirectivePlugin() {
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

function citationPlugin(options: { citationIndex?: Map<string, number> } = {}) {
  const citationIndex = options.citationIndex ?? new Map<string, number>()

  return (tree: unknown) => {
    findAndReplace(tree as any, [
      [
        citationPattern,
        (_match: string, rawGroup: string) => {
          const keys = parseCitationGroup(rawGroup)

          if (keys.length === 0) {
            return _match
          }

          const nodes: any[] = [
            {
              type: 'text',
              value: '[',
            },
          ]

          keys.forEach((key, index) => {
            const citationNumber = citationIndex.get(key)

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

            if (index < keys.length - 1) {
              nodes.push({
                type: 'text',
                value: ', ',
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

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const { citationIndex = new Map<string, number>(), source } = props

  return (
    <ReactMarkdown
      components={{
        a: ({ children, href, ...rest }) => {
          const isReference = typeof href === 'string' && href.startsWith('#reference-')

          return (
            <a
              {...rest}
              className={isReference ? 'citation-link' : undefined}
              href={href}
              rel={isReference ? undefined : 'noreferrer'}
              target={isReference ? undefined : '_blank'}
            >
              {children}
            </a>
          )
        },
        aside: ({ children, className }) => (
          <aside className={className}>
            {children}
          </aside>
        ),
        img: ({ alt, src }) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={alt ?? ''} loading="lazy" src={src ?? ''} />
        ),
      }}
      remarkPlugins={[remarkGfm, remarkDirective, calloutDirectivePlugin, [citationPlugin, { citationIndex }]]}
    >
      {source}
    </ReactMarkdown>
  )
}
