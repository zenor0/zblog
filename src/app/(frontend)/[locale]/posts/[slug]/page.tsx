import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { PostArticle } from '@/features/posts/ui/PostArticle'
import { getPostBySlug, getRenderablePostLocales } from '@/features/posts/server/queries'
import { getPreviewUser } from '@/features/posts/server/preview-user'
import { getPostViewMetric } from '@/features/post-views/server/post-views'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { getFrontendVariantSelection } from '@/features/frontend-variants/server/frontend-variants'
import { buildLocaleLinks, requireLocale } from '@/i18n/routing'
import { getPayloadClient } from '@/shared/payload/client'
import { buildLocalePath } from '@/shared/i18n/locales'
import {
  buildArticleStructuredData,
  buildPageMetadata,
  buildSeoDescription,
  serializeStructuredData,
} from '@/shared/content/seo'

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const requestedSiteSettings = await getResolvedSiteSettings(locale)
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
  const siteSettings = await getResolvedSiteSettings(canonicalLocale)
  const metaImage =
    resolved.post.seo?.metaImage && typeof resolved.post.seo.metaImage === 'object'
      ? resolved.post.seo.metaImage
      : null
  const heroImage =
    resolved.post.heroImage && typeof resolved.post.heroImage === 'object'
      ? resolved.post.heroImage
      : null
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
    siteURL: siteSettings.siteURL,
    title: resolved.post.seo?.metaTitle || resolved.post.title,
  })
}

export default async function PostPage(props: {
  params: Promise<{ locale: string; slug: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale: localeParam, slug } = await props.params
  const searchParams = await props.searchParams
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

  const siteSettings = await getResolvedSiteSettings(resolved.resolvedLocale)
  const payload = await getPayloadClient()
  const postViewMetric = await getPostViewMetric({
    locale: resolved.resolvedLocale,
    payload,
    postId: resolved.post.id,
  })
  const articleTocSelection = await getFrontendVariantSelection('article.toc', searchParams)
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
          (resolved.post.heroImage && typeof resolved.post.heroImage === 'object'
            ? resolved.post.heroImage
            : null) ??
          (siteSettings.seo?.defaultSocialImage &&
          typeof siteSettings.seo.defaultSocialImage === 'object'
            ? siteSettings.seo.defaultSocialImage
            : null),
        locale: resolved.resolvedLocale,
        modifiedAt: resolved.post.updatedAt,
        pathname: `/posts/${encodeURIComponent(resolved.post.slug)}`,
        publishedAt: resolved.post.publishedAt,
        siteDescription: siteSettings.siteDescription,
        siteName: siteSettings.siteName,
        siteURL: siteSettings.siteURL,
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
        articleTocConfig={articleTocSelection.config}
        articleTocVariant={articleTocSelection.variant}
        backHref={buildLocalePath(locale)}
        backLabel={article('backToIndex')}
        historyHref={buildLocalePath(locale, `/posts/${slug}/history`)}
        locale={locale}
        localeLinks={buildLocaleLinks(`/posts/${slug}`)}
        previewExitPath={buildLocalePath(locale, `/posts/${slug}`)}
        resolved={resolved}
        shouldTrackView={!resolved.usedDraftAccess}
        viewCount={postViewMetric.viewCount}
      />
    </>
  )
}
