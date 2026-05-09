import React from 'react'
import {
  AlertCircleIcon,
  BadgeAlertIcon,
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'

import { ArticleLinkPreviewLink } from '@/components/frontend/ArticleLinkPreviewLink'
import {
  buildHeadingLinkPreviews,
  createFallbackLinkPreview,
  readLinkPreviewFromDataAttributes,
  type ArticleLinkPreview,
} from '@/lib/article-link-previews'
import { extractMarkdownHeadings } from '@/lib/markdown-headings'

import { extractMarkdownMediaSources, prepareMarkdownSource } from '@/lib/markdown/article-syntax'
import {
  extractCodeLanguageFromClassName,
  highlightCodeSnippet,
} from '@/lib/markdown/code-highlighting'
import {
  articleElementsPlugin,
  citationPlugin,
  githubCalloutBlockquotePlugin,
  markdownComponentDirectivePlugin,
} from '@/lib/markdown/plugins'
import { extractCodeBlockLanguage, MarkdownFigure, MarkdownImage } from '@/lib/markdown/renderers'
import type { MarkdownRendererProps } from '@/lib/markdown/types'
import { markdownComponentRenderers } from '@/lib/markdown/component-registry'

function joinClassNames(...values: Array<null | string | string[] | undefined>) {
  return (
    values
      .flatMap((value) => {
        if (!value) {
          return []
        }

        return Array.isArray(value) ? value : [value]
      })
      .join(' ') || undefined
  )
}

type ExtendedMarkdownComponents = Components & typeof markdownComponentRenderers

export { extractMarkdownMediaSources }

function extractReactNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractReactNodeText(child)).join('')
  }

  if (React.isValidElement(node)) {
    return extractReactNodeText((node.props as { children?: React.ReactNode }).children)
  }

  return ''
}

function resolveCalloutIcon(kind: unknown) {
  switch (kind) {
    case 'tip':
      return LightbulbIcon
    case 'important':
      return BadgeAlertIcon
    case 'warning':
      return TriangleAlertIcon
    case 'caution':
      return AlertCircleIcon
    case 'note':
    default:
      return InfoIcon
  }
}

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const {
    articleReferenceLabels = {},
    bibliographyPreviewsByKey = {},
    citationIndex = new Map<string, number>(),
    headings,
    linkPreviewsByHref = {},
    mediaBySource = {},
    source,
  } = props
  const preparedSource = prepareMarkdownSource(source)
  const resolvedHeadings = headings ?? extractMarkdownHeadings(source)
  const resolvedLinkPreviewsByHref: Record<string, ArticleLinkPreview> = {
    ...buildHeadingLinkPreviews(resolvedHeadings),
    ...linkPreviewsByHref,
  }
  let headingCursor = 0

  const resolveLinkPreview = (args: {
    children: React.ReactNode
    href?: Blob | null | string
    props: Record<string, unknown>
  }) => {
    const href = typeof args.href === 'string' ? args.href : null

    if (!href) {
      return null
    }

    const previewKey =
      typeof args.props['data-link-preview-key'] === 'string'
        ? args.props['data-link-preview-key'].trim().toLowerCase()
        : null

    if (previewKey && bibliographyPreviewsByKey[previewKey]) {
      return bibliographyPreviewsByKey[previewKey]
    }

    return (
      readLinkPreviewFromDataAttributes(args.props, href) ??
      resolvedLinkPreviewsByHref[href] ??
      createFallbackLinkPreview(href, extractReactNodeText(args.children))
    )
  }

  const renderHeading = (
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  ): NonNullable<Components[typeof tag]> => {
    const HeadingRenderer: NonNullable<Components[typeof tag]> = ({
      children,
      node: _node,
      ...rest
    }) => {
      const heading = resolvedHeadings[headingCursor]
      const displayNumber = heading?.displayNumber
      const id = heading?.id
      const Tag = tag

      if (heading) {
        headingCursor += 1
      }

      return (
        <Tag
          {...rest}
          data-article-heading={displayNumber ? 'true' : undefined}
          data-article-heading-level={displayNumber ? String(heading.depth) : undefined}
          data-article-heading-number={displayNumber}
          id={id}
        >
          {children}
        </Tag>
      )
    }

    HeadingRenderer.displayName = `Markdown${tag.toUpperCase()}Heading`

    return HeadingRenderer
  }

  const components: ExtendedMarkdownComponents = {
    a: ({ children, href, node: _node, ...rest }: any) => {
      const isHashLink = typeof href === 'string' && href.startsWith('#')
      const isExternalLink = typeof href === 'string' && /^https?:\/\//i.test(href)
      const preview = resolveLinkPreview({ children, href, props: rest })

      return (
        <ArticleLinkPreviewLink
          {...rest}
          className={joinClassNames(rest.className, isHashLink ? 'citation-link' : undefined)}
          href={href}
          preview={preview}
          rel={isExternalLink ? 'noreferrer' : undefined}
          target={isExternalLink ? '_blank' : undefined}
        >
          {children}
        </ArticleLinkPreviewLink>
      )
    },
    aside: ({ children, className, node: _node, ...rest }: any) => {
      const calloutLabel =
        typeof rest['data-callout-label'] === 'string' ? rest['data-callout-label'] : null
      const Icon = resolveCalloutIcon(rest['data-kind'])

      return (
        <aside {...rest} className={joinClassNames(className)}>
          {calloutLabel ? (
            <div className="md-callout__title">
              <Icon aria-hidden="true" className="md-callout__icon" />
              <span>{calloutLabel}</span>
            </div>
          ) : null}
          <div className="md-callout__content">{children}</div>
        </aside>
      )
    },
    code: ({ children, className, node: _node, ...rest }: any) => {
      const language = extractCodeLanguageFromClassName(className)

      if (!language) {
        return (
          <code {...rest} className={className}>
            {children}
          </code>
        )
      }

      const code = String(children).replace(/\n$/, '')
      const highlighted = highlightCodeSnippet(code, language)

      return (
        <code
          {...rest}
          className={joinClassNames(
            className,
            'markdown-codeblock__code',
            highlighted.highlighted ? 'markdown-codeblock__code--highlighted' : undefined,
          )}
          data-highlight-language={highlighted.language ?? undefined}
          data-highlighted={highlighted.highlighted ? 'true' : undefined}
          dangerouslySetInnerHTML={{ __html: highlighted.html }}
        />
      )
    },
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
        'data-article-number': articleNumber,
        ...paragraphProps
      } = rest
      const imageNode = Array.isArray(node?.children)
        ? node.children.find((child: any) => child?.tagName === 'img')
        : null
      const imageProps = imageNode?.properties ?? {}

      if (
        articleKind === 'fig' &&
        typeof articleAnchorId === 'string' &&
        typeof articleNumber === 'string'
      ) {
        return (
          <MarkdownFigure
            alt={typeof imageProps.alt === 'string' ? imageProps.alt : null}
            anchorId={articleAnchorId}
            label={`${articleReferenceLabels.fig ?? 'Figure'} ${articleNumber}`}
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
        'data-article-number': articleNumber,
        ...tableProps
      } = rest
      const table = (
        <div className="markdown-table__scroll">
          <table {...tableProps}>{children}</table>
        </div>
      )

      if (articleKind !== 'tbl' || typeof articleNumber !== 'string') {
        return table
      }

      const articleLabel = `${articleReferenceLabels.tbl ?? 'Table'} ${articleNumber}`

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
    ...markdownComponentRenderers,
  }

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[
        remarkGfm,
        remarkDirective,
        githubCalloutBlockquotePlugin,
        articleElementsPlugin,
        markdownComponentDirectivePlugin,
        [citationPlugin, { articleReferenceLabels, citationIndex }],
      ]}
    >
      {preparedSource}
    </ReactMarkdown>
  )
}
