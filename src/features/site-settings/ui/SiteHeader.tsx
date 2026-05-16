'use client'

import Link from 'next/link'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'

import { LocaleSwitcher } from '@/shared/ui/LocaleSwitcher'
import { ThemeSwitcher } from '@/shared/ui/ThemeSwitcher'
import { supportedLocales, type AppLocale } from '@/shared/i18n/locales'
import type { SiteHeaderTaglineMode } from '@/features/site-settings/model/site-header'
import { cn } from '@/shared/utils/cn'

export type SiteHeaderNavItem = {
  href: string
  label: string
  segment: string
}

type SiteHeaderLabels = {
  localeNavigation: string
  navLabel: string
  themeAuto: string
  themeDark: string
  themeLight: string
  themeNavigation: string
}

type SiteHeaderProps = {
  activeLocale: AppLocale
  className?: string
  homeHref: string
  labels: SiteHeaderLabels
  navItems: SiteHeaderNavItem[]
  siteName: string
  tagline: string | null
  taglineMode: SiteHeaderTaglineMode
}

function buildLocaleSwitcherItems(pathname: null | string) {
  const pathSegments = (pathname ?? '').split('/').filter(Boolean)
  const pathWithoutLocale = pathSegments.slice(1).join('/')

  return supportedLocales.map((locale) => ({
    href: pathWithoutLocale ? `/${locale.slug}/${pathWithoutLocale}` : `/${locale.slug}`,
    label: locale.label,
    locale: locale.code,
  }))
}

export function SiteHeader(props: SiteHeaderProps) {
  const { activeLocale, className, homeHref, labels, navItems, siteName, tagline, taglineMode } =
    props
  const activeSegment = useSelectedLayoutSegment()
  const pathname = usePathname()
  const localeItems = buildLocaleSwitcherItems(pathname)
  const showTagline = taglineMode !== 'hidden' && Boolean(tagline)

  return (
    <header
      className={cn('site-header', className)}
      data-header-tagline-mode={showTagline ? taglineMode : 'hidden'}
      data-site-header=""
    >
      <div className="site-header__inner">
        <Link
          aria-current={activeSegment ? undefined : 'page'}
          className="site-header__brand"
          href={homeHref}
        >
          <span className="site-header__brand-name">{siteName}</span>
          {showTagline ? <span className="site-header__tagline">{tagline}</span> : null}
        </Link>

        <nav aria-label={labels.navLabel} className="site-header__nav" data-site-header-nav="">
          {navItems.map((item) => (
            <Link
              aria-current={item.segment === activeSegment ? 'page' : undefined}
              className="site-header__link"
              href={item.href}
              key={item.segment}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__tools">
          <ThemeSwitcher
            label={labels.themeNavigation}
            labels={{
              auto: labels.themeAuto,
              dark: labels.themeDark,
              light: labels.themeLight,
            }}
          />
          <LocaleSwitcher
            activeLocale={activeLocale}
            items={localeItems}
            label={labels.localeNavigation}
          />
        </div>
      </div>
    </header>
  )
}
