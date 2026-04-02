'use client'

import { startTransition, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import type { MarkdownHeading } from '@/lib/markdown-headings'

type PostTableOfContentsProps = {
  headings: MarkdownHeading[]
  label: string
  progressLabel: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function resolveActiveHeading(headings: MarkdownHeading[]) {
  const marker = window.scrollY + window.innerHeight * 0.24
  let activeID = headings[0]?.id ?? ''

  for (const heading of headings) {
    const element = document.getElementById(heading.id)

    if (!element) {
      continue
    }

    const top = element.getBoundingClientRect().top + window.scrollY

    if (top <= marker) {
      activeID = heading.id
      continue
    }

    break
  }

  return activeID
}

function resolveReadingProgress() {
  const content = document.querySelector<HTMLElement>('[data-post-reading-root]')

  if (!content) {
    return 0
  }

  const top = content.getBoundingClientRect().top + window.scrollY
  const end = top + content.offsetHeight - window.innerHeight * 0.35
  const current = window.scrollY + window.innerHeight * 0.22
  const total = Math.max(end - top, 1)

  return Math.round(clamp(((current - top) / total) * 100, 0, 100))
}

export function PostTableOfContents(props: PostTableOfContentsProps) {
  const { headings, label, progressLabel } = props
  const [activeID, setActiveID] = useState(headings[0]?.id ?? '')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const sync = () => {
      cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const nextActiveID = resolveActiveHeading(headings)
        const nextProgress = resolveReadingProgress()

        startTransition(() => {
          setActiveID((current) => (current === nextActiveID ? current : nextActiveID))
          setProgress((current) => (current === nextProgress ? current : nextProgress))
        })
      })
    }

    sync()
    window.addEventListener('resize', sync)
    window.addEventListener('scroll', sync, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', sync)
      window.removeEventListener('scroll', sync)
    }
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <section
      className="flex min-w-0 flex-col gap-4 border-t border-border pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0"
      data-toc-rail=""
    >
      <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="section-kicker">{progressLabel}</p>
          <h2 className="font-serif text-xl tracking-[-0.02em] text-foreground">{label}</h2>
        </div>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {progress}%
        </span>
      </div>

      <nav aria-label={label} className="max-h-[min(62vh,32rem)] overflow-y-auto pr-1">
        <ol className="flex flex-col gap-2">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                aria-current={activeID === heading.id ? 'location' : undefined}
                className={cn(
                  'block min-w-0 border-l border-transparent pl-3 text-[13px] leading-5 text-foreground/62 wrap-anywhere transition-colors hover:border-border hover:text-foreground',
                  heading.depth === 3 && 'ml-3',
                  heading.depth >= 4 && 'ml-5',
                  activeID === heading.id && 'border-foreground text-foreground',
                )}
                href={`#${heading.id}`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  )
}
