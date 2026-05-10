import { cache } from 'react'

import { defaultLocale, type AppLocale } from '@/lib/locales'
import { getPayloadClient } from '@/lib/payload'
import { resolveSiteSettingReferences } from '@/lib/site-settings-config'
import type { SiteSetting } from '@/payload-types'

export type SiteSettings = SiteSetting

const getCachedSiteSettings = cache(async (locale: AppLocale): Promise<SiteSettings> => {
  const payload = await getPayloadClient()

  return payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
    fallbackLocale: defaultLocale,
    locale,
  })
})

export async function getSiteSettings(locale: AppLocale) {
  return getCachedSiteSettings(locale)
}

const getCachedResolvedSiteSettings = cache(async (locale: AppLocale): Promise<SiteSettings> => {
  const settings = await getCachedSiteSettings(locale)

  return resolveSiteSettingReferences(settings)
})

export async function getResolvedSiteSettings(locale: AppLocale) {
  return getCachedResolvedSiteSettings(locale)
}
