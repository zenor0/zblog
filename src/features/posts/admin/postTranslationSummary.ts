import type { Post } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'

import { defaultLocale, getLocaleLabel } from '@/shared/i18n/locales'
import { formatStatus, getLocaleNote, hasText } from '@/features/posts/admin/postOverviewSummary'

export type TranslationLocaleSnapshot = {
  content?: null | string
  excerpt?: null | string
  title?: null | string
  translatedAt?: null | string
  translatedFromLocale?: null | string
  translationStatus?: Post['translationStatus']
}

export type TranslationLocaleRow = {
  code: AppLocale
  completedFields: number
  completionLabel: string
  isActive: boolean
  isDefault: boolean
  label: string
  snapshot: TranslationLocaleSnapshot | null
  translationNote: null | string
  translationStatusLabel: string
}

export function countTranslatedFields(snapshot: TranslationLocaleSnapshot | null): number {
  return Number(hasText(snapshot?.title)) + Number(hasText(snapshot?.excerpt)) + Number(hasText(snapshot?.content))
}

export function buildTranslationLocaleRow(args: {
  activeLocale: AppLocale
  locale: AppLocale
  snapshot: TranslationLocaleSnapshot | null
}): TranslationLocaleRow {
  const completedFields = countTranslatedFields(args.snapshot)

  return {
    code: args.locale,
    completedFields,
    completionLabel: `${completedFields}/3`,
    isActive: args.locale === args.activeLocale,
    isDefault: args.locale === defaultLocale,
    label: getLocaleLabel(args.locale),
    snapshot: args.snapshot,
    translationNote: getLocaleNote(args.snapshot, args.activeLocale),
    translationStatusLabel: formatStatus(args.snapshot?.translationStatus),
  }
}
