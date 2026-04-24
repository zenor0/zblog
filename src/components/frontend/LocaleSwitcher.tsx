'use client'

import Link from 'next/link'
import { CheckIcon, LanguagesIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

  return (
    <div className={cn('flex items-center justify-end', className)} data-locale-switcher="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={label}
            className="border border-border"
            size="icon-sm"
            title={label}
            variant="ghost"
          >
            <LanguagesIcon data-icon="inline-start" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" sideOffset={8}>
          <DropdownMenuLabel className="editorial-meta px-2 py-2">{label}</DropdownMenuLabel>
          <DropdownMenuGroup>
            {items.map((item) => (
              <DropdownMenuItem asChild key={item.locale}>
                <Link
                  aria-current={item.locale === activeLocale ? 'page' : undefined}
                  className="flex w-full items-center justify-between gap-3"
                  href={item.href}
                >
                  <span>{item.label}</span>
                  {item.locale === activeLocale ? <CheckIcon aria-hidden="true" /> : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
