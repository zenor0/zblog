'use client'

import Link from 'next/link'
import { LanguagesIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { AppLocale } from '@/lib/locales'
import { cn } from '@/lib/utils'

type LocaleLink = {
  href: string
  label: string
  locale: AppLocale
}

export function LocaleSwitcher(props: {
  activeLocale: AppLocale
  className?: string
  items: LocaleLink[]
  label: string
}) {
  const { activeLocale, className, items, label } = props
  const [open, setOpen] = useState(false)
  const activeItem = items.find((item) => item.locale === activeLocale)

  return (
    <div className={cn('flex items-center justify-end', className)} data-locale-switcher="">
      <div className="hidden flex-wrap items-center gap-3 sm:flex">
        {items.map((item, index) => (
          <span className="contents" key={item.locale}>
            {index > 0 ? <span className="text-border">/</span> : null}
            <Link
              className={cn(
                'editorial-meta transition-colors hover:text-foreground',
                item.locale === activeLocale && 'text-foreground',
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          </span>
        ))}
      </div>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger asChild>
          <Button
            className="h-auto border border-border px-3 py-2 text-[11px] uppercase tracking-[0.24em] sm:hidden"
            size="sm"
            variant="ghost"
          >
            <LanguagesIcon data-icon="inline-start" />
            {label}
          </Button>
        </SheetTrigger>
        <SheetContent className="gap-0 border-l border-border bg-background" side="right">
          <SheetHeader className="gap-2 border-b border-border pb-4">
            <SheetTitle className="font-serif text-2xl tracking-[-0.02em] text-foreground">
              {label}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {activeItem?.label ?? label}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 p-4">
            {items.map((item) => (
              <Link
                className={cn(
                  'border-b border-border pb-3 text-base text-foreground/78 transition-colors hover:text-foreground',
                  item.locale === activeLocale && 'text-foreground',
                )}
                href={item.href}
                key={item.locale}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
