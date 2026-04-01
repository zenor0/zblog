import React from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'

import { extractMarkdownHeadings } from '@/lib/markdown-headings'

import { extractMarkdownMediaSources, prepareMarkdownSource } from '@/lib/markdown/article-syntax'
import { articleElementsPlugin, calloutDirectivePlugin, citationPlugin } from '@/lib/markdown/plugins'
import { extractCodeBlockLanguage, MarkdownFigure, MarkdownImage } from '@/lib/markdown/renderers'
import type { MarkdownRendererProps } from '@/lib/markdown/types'

function joinClassNames(...values: Array<null | string | undefined>) {
  return values.filter(Boolean).join(' ') || undefined
}

export { extractMarkdownMediaSources }

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const { citationIndex = new Map<string, number>(), headings, mediaBySource = {}, source } = props
  const preparedSource = prepareMarkdownSource(source)
  const resolvedHeadings = headings ?? extractMarkdownHeadings(source)
  let headingCursor = 0

  const renderHeading =
    (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'): NonNullable<Components[typeof tag]> =>
    ({ children, node: _node, ...rest }) => {
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
        a: ({ children, href, node: _node, ...rest }: any) => {
          const isHashLink = typeof href === 'string' && href.startsWith('#')
          const isExternalLink = typeof href === 'string' && /^https?:\/\//i.test(href)

          return (
            <a
              {...rest}
              className={joinClassNames(rest.className, isHashLink ? 'citation-link' : undefined)}
              href={href}
              rel={isExternalLink ? 'noreferrer' : undefined}
              target={isExternalLink ? '_blank' : undefined}
            >
              {children}
            </a>
          )
        },
        aside: ({ children, className, node: _node }: any) => (
          <aside className={className}>
            {children}
          </aside>
        ),
        code: ({ children, className, node: _node, ...rest }: any) => (
          <code {...rest} className={className}>
            {children}
          </code>
        ),
        h1: renderHeading('h1'),
        h2: renderHeading('h2'),
        h3: renderHeading('h3'),
        h4: renderHeading('h4'),
        h5: renderHeading('h5'),
        h6: renderHeading('h6'),
        img: ({ alt, src, title }: any) => (
          <MarkdownImage alt={alt} mediaBySource={mediaBySource} src={src} title={title} />
        ),
        p: ({ children, node, ...rest }: any) => {
          const {
            'data-article-anchor-id': articleAnchorId,
            'data-article-caption': _articleCaption,
            'data-article-kind': articleKind,
            'data-article-label': articleLabel,
            'data-article-number': _articleNumber,
            ...paragraphProps
          } = rest
          const imageNode = Array.isArray(node?.children)
            ? node.children.find((child: any) => child?.tagName === 'img')
            : null
          const imageProps = imageNode?.properties ?? {}

          if (articleKind === 'fig' && typeof articleAnchorId === 'string' && typeof articleLabel === 'string') {
            return (
              <MarkdownFigure
                alt={typeof imageProps.alt === 'string' ? imageProps.alt : null}
                anchorId={articleAnchorId}
                label={articleLabel}
                mediaBySource={mediaBySource}
                src={typeof imageProps.src === 'string' ? imageProps.src : null}
                title={typeof imageProps.title === 'string' ? imageProps.title : null}
              />
            )
          }

          return <p {...paragraphProps}>{children}</p>
        },
        pre: ({ children, node: _node }: any) => {
          const language = extractCodeBlockLanguage(children)

          return (
            <pre className="markdown-codeblock" data-language={language ?? undefined}>
              {language ? <span className="markdown-codeblock__label">{language}</span> : null}
              {children}
            </pre>
          )
        },
        table: ({ children, node: _node, ...rest }: any) => {
          const {
            'data-article-anchor-id': articleAnchorId,
            'data-article-caption': articleCaption,
            'data-article-kind': articleKind,
            'data-article-label': articleLabel,
            'data-article-number': _articleNumber,
            ...tableProps
          } = rest
          const table = (
            <div className="markdown-table__scroll">
              <table {...tableProps}>{children}</table>
            </div>
          )

          if (articleKind !== 'tbl' || typeof articleLabel !== 'string') {
            return table
          }

          const caption =
            typeof articleCaption === 'string' && articleCaption.trim().length > 0
              ? `${articleLabel}. ${articleCaption}`
              : articleLabel

          return (
            <figure
              className="markdown-figure markdown-figure--table"
              id={typeof articleAnchorId === 'string' ? articleAnchorId : undefined}
            >
              {table}
              <figcaption className="markdown-figure__caption">{caption}</figcaption>
            </figure>
          )
        },
      }}
      remarkPlugins={[
        remarkGfm,
        remarkDirective,
        calloutDirectivePlugin,
        articleElementsPlugin,
        [citationPlugin, { citationIndex }],
      ]}
    >
      {preparedSource}
    </ReactMarkdown>
  )
}
