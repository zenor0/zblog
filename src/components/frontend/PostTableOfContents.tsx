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
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-sidebar-border bg-sidebar/80 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="section-kicker">{progressLabel}</p>
            <h2 className="text-base font-semibold text-sidebar-foreground">{label}</h2>
          </div>
          <span className="shrink-0 pt-0.5 text-xs font-medium text-sidebar-foreground/78">
            {progress}%
          </span>
        </div>

        <div
          aria-hidden="true"
          className="h-1 overflow-hidden rounded-full bg-sidebar-accent"
        >
          <div
            className="h-full rounded-full bg-sidebar-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <nav aria-label={label} className="max-h-[min(62vh,32rem)] overflow-y-auto pr-1">
        <ol className="flex flex-col gap-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                aria-current={activeID === heading.id ? 'location' : undefined}
                className={cn(
                  'block min-w-0 rounded-lg border border-transparent px-2.5 py-1.5 text-[13px] leading-5 text-sidebar-foreground/72 wrap-anywhere transition-colors hover:border-sidebar-border hover:bg-sidebar-accent/90 hover:text-sidebar-foreground',
                  heading.depth === 3 && 'ml-2.5',
                  heading.depth >= 4 && 'ml-4',
                  activeID === heading.id &&
                    'border-sidebar-border bg-sidebar-accent text-sidebar-foreground shadow-sm',
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
