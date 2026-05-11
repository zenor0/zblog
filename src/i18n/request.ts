import { getRequestConfig } from 'next-intl/server'

import { defaultLocale, normalizeLocale } from '@/shared/i18n/locales'
import { getMessagesForLocale } from '@/i18n/loadMessages'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = normalizeLocale(await requestLocale) ?? defaultLocale

  return {
    locale,
    messages: getMessagesForLocale(locale),
  }
})
