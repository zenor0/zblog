'use client'

import { ChevronDownIcon, LibraryBigIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type CollapsibleReferenceSectionProps = {
  children: ReactNode
  countLabel: string
  label: string
}

export function CollapsibleReferenceSection(props: CollapsibleReferenceSectionProps) {
  const { children, countLabel, label } = props
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const syncWithHash = () => {
      const hash = window.location.hash

      if (!hash || (hash !== '#references' && !hash.startsWith('#reference-'))) {
        return
      }

      setOpen(true)

      if (hash.startsWith('#reference-')) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            document.getElementById(hash.slice(1))?.scrollIntoView({
              block: 'start',
            })
          })
        })
      }
    }

    const openForCitationClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null

      if (!(target instanceof HTMLAnchorElement)) {
        return
      }

      const href = target.getAttribute('href') ?? ''

      if (href === '#references' || href.startsWith('#reference-')) {
        setOpen(true)

        if (href.startsWith('#reference-')) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              document.getElementById(href.slice(1))?.scrollIntoView({
                block: 'start',
              })
            })
          })
        }
      }
    }

    syncWithHash()
    window.addEventListener('hashchange', syncWithHash)
    document.addEventListener('click', openForCitationClick, true)

    return () => {
      window.removeEventListener('hashchange', syncWithHash)
      document.removeEventListener('click', openForCitationClick, true)
    }
  }, [])

  return (
    <details
      className="border border-border bg-muted/12"
      id="references"
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 items-center justify-center border border-border bg-background text-foreground/80">
            <LibraryBigIcon className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-serif text-lg tracking-[-0.02em] text-foreground sm:text-xl">
              {label}
            </span>
            <span className="text-xs text-muted-foreground sm:text-sm">{countLabel}</span>
          </span>
        </span>
        <ChevronDownIcon
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </summary>

      <div className="border-t border-border px-4 py-4 sm:px-5">{children}</div>
    </details>
  )
}
