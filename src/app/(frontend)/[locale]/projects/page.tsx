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
    slug: 'projects',
  })
}

export default async function ProjectsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getUtilityPageCopy(locale, 'projects')

  return (
    <UtilityPageShell copy={copy}>
      {copy.emptyState ? (
        <p className="max-w-2xl text-base leading-8 text-foreground/72">{copy.emptyState}</p>
      ) : null}
    </UtilityPageShell>
  )
}
