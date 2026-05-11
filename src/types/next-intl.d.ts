import type { AppMessages } from '@/i18n/loadMessages'
import type { AppLocale } from '@/shared/i18n/locales'

declare module 'next-intl' {
  interface AppConfig {
    Locale: AppLocale
    Messages: AppMessages
  }
}
