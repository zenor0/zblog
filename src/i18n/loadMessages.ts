import enMessages from '@/i18n/messages/en.json'
import zhHansMessages from '@/i18n/messages/zh-Hans.json'
import type { AppLocale } from '@/lib/locales'

export type AppMessages = typeof enMessages

const messagesByLocale = {
  en: enMessages,
  'zh-Hans': zhHansMessages,
} satisfies Record<AppLocale, AppMessages>

export function getMessagesForLocale(locale: AppLocale): AppMessages {
  return messagesByLocale[locale]
}
