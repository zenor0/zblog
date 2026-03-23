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
    <div className={cn('flex items-center justify-end', className)}>
      <div className="hidden flex-wrap gap-2 sm:flex">
        {items.map((item) => (
          <Button
            asChild
            key={item.locale}
            size="sm"
            variant={item.locale === activeLocale ? 'default' : 'outline'}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger asChild>
          <Button className="sm:hidden" size="sm" variant="outline">
            <LanguagesIcon data-icon="inline-start" />
            {label}
          </Button>
        </SheetTrigger>
        <SheetContent className="gap-0" side="right">
          <SheetHeader className="gap-2 border-b">
            <SheetTitle>{label}</SheetTitle>
            <SheetDescription>{activeItem?.label ?? label}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 p-4">
            {items.map((item) => (
              <Button
                asChild
                className="w-full justify-start"
                key={item.locale}
                variant={item.locale === activeLocale ? 'default' : 'outline'}
              >
                <Link href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
