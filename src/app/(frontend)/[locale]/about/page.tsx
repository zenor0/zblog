import type { Metadata } from 'next'

import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { UtilityPageShell } from '@/features/utility-pages/ui/UtilityPage'
import { buildUtilityPageMetadata } from '@/features/utility-pages/server/utility-page-metadata'
import { getUtilityPageCopy } from '@/features/utility-pages/model/utility-pages'
import { requireLocale } from '@/i18n/routing'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const settings = await getResolvedSiteSettings(locale)

  return buildUtilityPageMetadata({
    locale,
    settings,
    slug: 'about',
  })
}

export default async function AboutPage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)

  return <UtilityPageShell copy={getUtilityPageCopy(locale, 'about')} />
}
