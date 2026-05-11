import { cache } from 'react'

import { defaultLocale, type AppLocale } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'
import { resolveSiteSettingReferences } from '@/features/site-settings/model/site-settings-config'
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
