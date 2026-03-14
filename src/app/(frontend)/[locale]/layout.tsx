import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/frontend/SiteFooter'
import { requireLocale } from '@/app/(frontend)/helpers'
import { getSiteSettings } from '@/lib/site-settings'

export default async function LocaleLayout(props: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { children, params } = props
  const { locale: localeParam } = await params
  const locale = requireLocale(localeParam)
  const siteSettings = await getSiteSettings(locale)

  return (
    <>
      {children}
      <SiteFooter settings={siteSettings} />
    </>
  )
}
