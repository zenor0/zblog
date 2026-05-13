import type { ReactNode } from 'react'

import { cn } from '@/shared/utils/cn'

export type PostArticleTitleLayoutID = 'compact-stack' | 'title-led' | 'split-meta'

export type PostArticleTitleLayoutOption = {
  description: string
  id: PostArticleTitleLayoutID
  name: string
}

export const postArticleTitleLayoutOptions: PostArticleTitleLayoutOption[] = [
  {
    id: 'compact-stack',
    name: '候选 A / 紧凑叠放',
    description: '保留元信息在前，标题和摘要靠得更近，适合作为当前正式文章页的低风险调整。',
  },
  {
    id: 'title-led',
    name: '候选 B / 标题优先',
    description: '标题先进入视线，元信息下移到摘要之后，页面开头更像一篇安静的长文。',
  },
  {
    id: 'split-meta',
    name: '候选 C / 侧栏元信息',
    description: '宽屏把元信息放到右侧，主阅读列只保留标题和摘要，信息密度最高。',
  },
]

type VariantClasses = {
  copy: string
  excerpt: string
  meta: string
  root: string
  title: string
}

const variantClasses: Record<PostArticleTitleLayoutID, VariantClasses> = {
  'compact-stack': {
    copy: 'flex flex-col gap-2.5',
    excerpt: 'max-w-3xl text-base leading-7 text-foreground/72 sm:text-[1.0625rem]',
    meta: 'editorial-meta flex flex-wrap items-center gap-x-4 gap-y-2',
    root: 'flex flex-col gap-4 border-b border-border pb-8',
    title:
      'max-w-4xl font-serif text-[2rem] leading-[1.12] text-foreground wrap-anywhere sm:text-[2.625rem] lg:text-[3.25rem]',
  },
  'title-led': {
    copy: 'flex flex-col gap-2',
    excerpt: 'max-w-3xl text-base leading-7 text-foreground/70 sm:text-[1.0625rem]',
    meta: 'editorial-meta flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3',
    root: 'flex flex-col gap-4 border-b border-border pb-8',
    title:
      'max-w-4xl font-serif text-[2.125rem] leading-[1.1] text-foreground wrap-anywhere sm:text-[2.75rem] lg:text-[3.375rem]',
  },
  'split-meta': {
    copy: 'flex flex-col gap-2.5',
    excerpt: 'max-w-3xl text-base leading-7 text-foreground/72 sm:text-[1.0625rem]',
    meta: 'editorial-meta flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-col md:items-end md:gap-1.5 md:text-right',
    root: 'grid gap-5 border-b border-border pb-8 md:grid-cols-[minmax(0,1fr)_13rem] md:items-start',
    title:
      'max-w-4xl font-serif text-[2rem] leading-[1.12] text-foreground wrap-anywhere sm:text-[2.625rem] lg:text-[3.125rem]',
  },
}

export function PostArticleTitleBlock(props: {
  className?: string
  excerpt?: null | ReactNode
  headingLevel?: 'h1' | 'h2'
  label?: null | ReactNode
  meta: ReactNode
  title: ReactNode
  variant?: PostArticleTitleLayoutID
}) {
  const {
    className,
    excerpt,
    headingLevel = 'h1',
    label,
    meta,
    title,
    variant = 'compact-stack',
  } = props
  const classes = variantClasses[variant]
  const Heading = headingLevel
  const titleCopy = (
    <div
      className={classes.copy}
      data-article-title-copy=""
      data-article-title-copy-spacing="compact"
    >
      {label ? <p className="section-kicker">{label}</p> : null}
      <Heading className={classes.title}>{title}</Heading>
      {excerpt ? <p className={classes.excerpt}>{excerpt}</p> : null}
    </div>
  )
  const metaRow = <div className={classes.meta}>{meta}</div>

  return (
    <header
      className={cn(classes.root, className)}
      data-article-frontmatter=""
      data-article-title-layout={variant}
    >
      {variant === 'compact-stack' ? (
        <>
          {metaRow}
          {titleCopy}
        </>
      ) : (
        <>
          {titleCopy}
          {metaRow}
        </>
      )}
    </header>
  )
}
