import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { buildLocaleLinks, requireLocale } from '@/i18n/routing'
import { PostArticle } from '@/components/frontend/PostArticle'
import { buildLocalePath } from '@/lib/locales'
import { getPostBySlug, getRenderablePostLocales } from '@/lib/posts'
import { getPreviewUser } from '@/lib/preview-user'
import {
  buildArticleStructuredData,
  buildPageMetadata,
  buildSeoDescription,
  serializeStructuredData,
} from '@/lib/seo'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const requestedSiteSettings = await getSiteSettings(locale)
  const resolved = await getPostBySlug({
    locale,
    slug,
  })

  if (!resolved) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: `${article('postNotFoundTitle')} | ${requestedSiteSettings.siteName}`,
    }
  }

  const availableLocales = await getRenderablePostLocales({ slug })
  const canonicalLocale = resolved.usedFallback ? resolved.resolvedLocale : locale
  const canonicalPath = `/posts/${encodeURIComponent(resolved.post.slug)}`
  const siteSettings = await getSiteSettings(canonicalLocale)
  const metaImage =
    resolved.post.seo?.metaImage && typeof resolved.post.seo.metaImage === 'object'
      ? resolved.post.seo.metaImage
      : null
  const heroImage =
    resolved.post.heroImage && typeof resolved.post.heroImage === 'object' ? resolved.post.heroImage : null
  const defaultSocialImage =
    siteSettings.seo?.defaultSocialImage && typeof siteSettings.seo.defaultSocialImage === 'object'
      ? siteSettings.seo.defaultSocialImage
      : null
  const shouldIndex = !resolved.usedFallback && !resolved.post.seo?.noindex

  return buildPageMetadata({
    canonicalLocale,
    content: resolved.post.content,
    description: resolved.post.seo?.metaDescription || resolved.post.excerpt || undefined,
    fallbackDescription: siteSettings.siteDescription,
    fallbackImage: defaultSocialImage,
    image: metaImage ?? heroImage,
    locales: availableLocales.length ? availableLocales : [canonicalLocale],
    openGraphType: 'article',
    pathname: canonicalPath,
    publishedTime: resolved.post.publishedAt ?? resolved.post.updatedAt,
    robots: {
      follow: true,
      index: shouldIndex,
    },
    siteName: siteSettings.siteName,
    title: resolved.post.seo?.metaTitle || resolved.post.title,
  })
}

export default async function PostPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const preview = await draftMode()
  const previewUser = preview.isEnabled ? await getPreviewUser() : null

  const resolved = await getPostBySlug({
    draft: preview.isEnabled,
    locale,
    slug,
    user: previewUser,
  })

  if (!resolved) {
    notFound()
  }

  const siteSettings = await getSiteSettings(resolved.resolvedLocale)
  const shouldRenderStructuredData = !resolved.usedFallback && !resolved.post.seo?.noindex
  const structuredData = shouldRenderStructuredData
    ? buildArticleStructuredData({
        authorName: siteSettings.footer?.brand?.name || siteSettings.siteName,
        description: buildSeoDescription({
          content: resolved.post.content,
          fallback: siteSettings.siteDescription,
          value: resolved.post.seo?.metaDescription || resolved.post.excerpt,
        }),
        image:
          (resolved.post.seo?.metaImage && typeof resolved.post.seo.metaImage === 'object'
            ? resolved.post.seo.metaImage
            : null) ??
          (resolved.post.heroImage && typeof resolved.post.heroImage === 'object' ? resolved.post.heroImage : null) ??
          (siteSettings.seo?.defaultSocialImage && typeof siteSettings.seo.defaultSocialImage === 'object'
            ? siteSettings.seo.defaultSocialImage
            : null),
        locale: resolved.resolvedLocale,
        modifiedAt: resolved.post.updatedAt,
        pathname: `/posts/${encodeURIComponent(resolved.post.slug)}`,
        publishedAt: resolved.post.publishedAt,
        siteDescription: siteSettings.siteDescription,
        siteName: siteSettings.siteName,
        title: resolved.post.seo?.metaTitle || resolved.post.title,
      })
    : null

  return (
    <>
      {structuredData ? (
        <script
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(structuredData),
          }}
          type="application/ld+json"
        />
      ) : null}
      <PostArticle
        backHref={buildLocalePath(locale)}
        backLabel={article('backToIndex')}
        historyHref={buildLocalePath(locale, `/posts/${slug}/history`)}
        locale={locale}
        localeLinks={buildLocaleLinks(`/posts/${slug}`)}
        previewExitPath={buildLocalePath(locale, `/posts/${slug}`)}
        resolved={resolved}
      />
    </>
  )
}
