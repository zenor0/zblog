import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { PageArticle } from '@/features/pages/ui/PageArticle'
import {
  getPageBySlug,
  getRenderablePageLocales,
  isPageIndexable,
} from '@/features/pages/server/queries'
import { getPreviewUser } from '@/features/posts/server/preview-user'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { requireLocale } from '@/i18n/routing'
import { buildPagePath } from '@/features/pages/model/page-slugs'
import { buildPageMetadata } from '@/shared/content/seo'

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const requestedSiteSettings = await getResolvedSiteSettings(locale)
  const resolved = await getPageBySlug({
    locale,
    slug,
  })

  if (!resolved) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: requestedSiteSettings.siteName,
    }
  }

  const canonicalLocale = resolved.usedFallback ? resolved.resolvedLocale : locale
  const availableLocales = await getRenderablePageLocales({ slug })
  const siteSettings = await getResolvedSiteSettings(canonicalLocale)
  const metaImage =
    resolved.page.seo?.metaImage && typeof resolved.page.seo.metaImage === 'object'
      ? resolved.page.seo.metaImage
      : null
  const defaultSocialImage =
    siteSettings.seo?.defaultSocialImage && typeof siteSettings.seo.defaultSocialImage === 'object'
      ? siteSettings.seo.defaultSocialImage
      : null

  return buildPageMetadata({
    canonicalLocale,
    content: resolved.page.content,
    description: resolved.page.seo?.metaDescription || resolved.page.description,
    fallbackDescription: siteSettings.siteDescription,
    fallbackImage: defaultSocialImage,
    image: metaImage,
    locales: availableLocales.length ? availableLocales : [canonicalLocale],
    pathname: buildPagePath(resolved.page.slug),
    robots: {
      follow: true,
      index: !resolved.usedFallback && isPageIndexable(resolved.page),
    },
    siteName: siteSettings.siteName,
    title: resolved.page.seo?.metaTitle || resolved.page.title,
  })
}

export default async function CMSPage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const preview = await draftMode()
  const previewUser = preview.isEnabled ? await getPreviewUser() : null
  const resolved = await getPageBySlug({
    draft: preview.isEnabled,
    locale,
    slug,
    user: previewUser,
  })

  if (!resolved) {
    notFound()
  }

  return <PageArticle resolved={resolved} />
}
