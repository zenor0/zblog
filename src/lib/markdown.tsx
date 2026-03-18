import { findAndReplace } from 'mdast-util-find-and-replace'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

import { parseCitationGroup } from '@/lib/citations'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { resolveMediaAsset } from '@/lib/media'

type MarkdownRendererProps = {
  citationIndex?: Map<string, number>
  source: string
}

const citationPattern = /\[@([^\]]+)\]/g
const calloutKinds = new Set(['note', 'tip', 'warning', 'info'])

function MarkdownImage(props: { alt?: null | string; src?: Blob | null | string }) {
  const asset = resolveMediaAsset({
    alt: props.alt,
    src: typeof props.src === 'string' ? props.src : null,
  })

  if (!asset) {
    return null
  }

  const media = <MediaSurface asset={asset} variant="inline" />

  if (asset.kind === 'pdf' || asset.kind === 'unknown') {
    return (
      <a className="markdown-media-link" href={asset.downloadURL} rel="noreferrer" target="_blank">
        {media}
      </a>
    )
  }

  return media
}

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
        img: ({ alt, src }) => <MarkdownImage alt={alt} src={src} />,
      }}
      remarkPlugins={[remarkGfm, remarkDirective, calloutDirectivePlugin, [citationPlugin, { citationIndex }]]}
    >
      {source}
    </ReactMarkdown>
  )
}
