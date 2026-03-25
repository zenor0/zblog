import { findAndReplace } from 'mdast-util-find-and-replace'
import React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

import type { Media } from '@/payload-types'

import { parseCitationGroup } from '@/lib/citations'
import { MediaDetails } from '@/components/frontend/MediaDetails'
import { MediaSurface } from '@/components/frontend/MediaSurface'
import { extractMarkdownHeadings, type MarkdownHeading } from '@/lib/markdown-headings'
import { resolveMediaAsset, resolveMediaCaption } from '@/lib/media'

type MarkdownRendererProps = {
  citationIndex?: Map<string, number>
  headings?: MarkdownHeading[]
  mediaBySource?: Record<string, MarkdownMediaLike>
  source: string
}

type MarkdownMediaLike = Pick<
  Media,
  | 'alt'
  | 'caption'
  | 'credit'
  | 'filename'
  | 'height'
  | 'mimeType'
  | 'previewSVGURL'
  | 'url'
  | 'width'
>

const citationPattern = /\[@([^\]]+)\]/g
const calloutKinds = new Set(['note', 'tip', 'warning', 'info'])
const markdownImagePattern = /!\[[^\]]*]\((?:<([^>]+)>|([^\s)]+))(?:\s+(?:"[^"]*"|'[^']*'))?\)/g

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

function MarkdownImage(props: {
  alt?: null | string
  mediaBySource?: Record<string, MarkdownMediaLike>
  src?: Blob | null | string
  title?: null | string
}) {
  const source = typeof props.src === 'string' ? props.src : null
  const media = source ? props.mediaBySource?.[source] ?? null : null
  const asset = resolveMediaAsset({
    alt: props.alt,
    media,
    src: source,
  })

  if (!asset) {
    return null
  }

  const surface = <MediaSurface asset={asset} variant="inline" />
  const caption = resolveMediaCaption({
    alt: asset.alt,
    caption: asset.caption,
    title: props.title,
  })
  const credit = asset.credit?.trim() || null

  if (asset.kind === 'pdf' || asset.kind === 'unknown') {
    return (
      <span className="markdown-media">
        <a className="markdown-media-link" href={asset.downloadURL} rel="noreferrer" target="_blank">
          {surface}
        </a>
        <MediaDetails caption={caption} className="markdown-media__details" credit={credit} />
      </span>
    )
  }

  return (
    <span className="markdown-media">
      {surface}
      <MediaDetails caption={caption} className="markdown-media__details" credit={credit} />
    </span>
  )
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
  const { citationIndex = new Map<string, number>(), headings, mediaBySource = {}, source } = props
  const resolvedHeadings = headings ?? extractMarkdownHeadings(source)
  let headingCursor = 0

  const renderHeading =
    (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'): NonNullable<Components[typeof tag]> =>
    ({ children, ...rest }) => {
      const heading = resolvedHeadings[headingCursor]
      const id = heading?.id
      const Tag = tag

      if (heading) {
        headingCursor += 1
      }

      return (
        <Tag {...rest} id={id}>
          {children}
        </Tag>
      )
    }

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
        h1: renderHeading('h1'),
        h2: renderHeading('h2'),
        h3: renderHeading('h3'),
        h4: renderHeading('h4'),
        h5: renderHeading('h5'),
        h6: renderHeading('h6'),
        img: ({ alt, src, title }) => (
          <MarkdownImage alt={alt} mediaBySource={mediaBySource} src={src} title={title} />
        ),
      }}
      remarkPlugins={[remarkGfm, remarkDirective, calloutDirectivePlugin, [citationPlugin, { citationIndex }]]}
    >
      {source}
    </ReactMarkdown>
  )
}
