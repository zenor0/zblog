import type { CSSProperties, ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { SiteFooter } from '@/components/frontend/SiteFooter'
import { getMessagesForLocale } from '@/i18n/loadMessages'
import { requireLocale } from '@/i18n/routing'
import { resolveArticleLayoutConfig } from '@/lib/article-layout'
import { getSiteSettings } from '@/lib/site-settings'

export default async function LocaleLayout(props: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { children, params } = props
  const { locale: localeParam } = await params
  const locale = requireLocale(localeParam)
  const messages = getMessagesForLocale(locale)

  setRequestLocale(locale)

  const siteSettings = await getSiteSettings(locale)
  const articleLayout = resolveArticleLayoutConfig(siteSettings.articleLayout)
  const articleLayoutStyle =
    articleLayout.presetID === 'current' ? undefined : (articleLayout.style as CSSProperties)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        data-article-layout-preset={articleLayout.presetID}
        data-site-article-layout=""
        style={articleLayoutStyle}
      >
        {children}
      </div>
      <SiteFooter locale={locale} settings={siteSettings} />
    </NextIntlClientProvider>
  )
}
