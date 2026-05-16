import type { CSSProperties, ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteFooter } from '@/features/site-settings/ui/SiteFooter'
import { SiteHeader } from '@/features/site-settings/ui/SiteHeader'
import { resolveArticleDesignConfig } from '@/features/article/model/article-design'
import { getSiteHeaderConfig } from '@/features/site-settings/model/site-header'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { getMessagesForLocale } from '@/i18n/loadMessages'
import { requireLocale } from '@/i18n/routing'
import { buildLocalePath } from '@/shared/i18n/locales'
import { resolveFrontendAccentStyle } from '@/shared/theme/frontend-theme'

export default async function LocaleLayout(props: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { children, params } = props
  const { locale: localeParam } = await params
  const locale = requireLocale(localeParam)
  const messages = getMessagesForLocale(locale)

  setRequestLocale(locale)

  const siteSettings = await getResolvedSiteSettings(locale)
  const common = await getTranslations({ locale, namespace: 'Common' })
  const home = await getTranslations({ locale, namespace: 'HomePage' })
  const articleLayout = resolveArticleDesignConfig(siteSettings.articleLayout)
  const articleLayoutStyle =
    articleLayout.presetID === 'current' ? undefined : (articleLayout.style as CSSProperties)
  const frontendAccentStyle = resolveFrontendAccentStyle(siteSettings)
  const headerConfig = getSiteHeaderConfig(siteSettings)

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div data-frontend-accent="" style={frontendAccentStyle}>
        <SiteHeader
          activeLocale={locale}
          homeHref={buildLocalePath(locale)}
          labels={{
            localeNavigation: common('localeNavigation'),
            navLabel: home('navLabel'),
            themeAuto: common('themeAuto'),
            themeDark: common('themeDark'),
            themeLight: common('themeLight'),
            themeNavigation: common('themeNavigation'),
          }}
          navItems={[
            {
              href: buildLocalePath(locale, '/posts'),
              label: home('navPosts'),
              segment: 'posts',
            },
            {
              href: buildLocalePath(locale, '/projects'),
              label: home('navProjects'),
              segment: 'projects',
            },
            {
              href: buildLocalePath(locale, '/about'),
              label: home('navAbout'),
              segment: 'about',
            },
          ]}
          siteName={siteSettings.siteName}
          tagline={headerConfig.tagline}
          taglineMode={headerConfig.taglineMode}
        />
        <div
          data-article-design-preset={articleLayout.presetID}
          data-article-layout-preset={articleLayout.presetID}
          data-site-article-layout=""
          style={articleLayoutStyle}
        >
          {children}
        </div>
        <SiteFooter locale={locale} settings={siteSettings} />
      </div>
    </NextIntlClientProvider>
  )
}
