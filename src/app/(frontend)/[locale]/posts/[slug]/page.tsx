import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { buildLocaleLinks, requireLocale } from '@/i18n/routing'
import { PostArticle } from '@/components/frontend/PostArticle'
import { buildLocalePath } from '@/lib/locales'
import { getPostBySlug, getRenderablePostLocales } from '@/lib/posts'
import { getPreviewUser } from '@/lib/preview-user'
import { buildLocaleAlternates } from '@/lib/seo'
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

  return {
    alternates: buildLocaleAlternates({
      canonicalLocale,
      locales: availableLocales.length ? availableLocales : [canonicalLocale],
      pathname: canonicalPath,
    }),
    description: resolved.post.excerpt || undefined,
    robots: {
      follow: true,
      index: !resolved.usedFallback,
    },
    title: `${resolved.post.title} | ${siteSettings.siteName}`,
  }
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

  return (
    <PostArticle
      backHref={buildLocalePath(locale)}
      backLabel={article('backToIndex')}
      historyHref={buildLocalePath(locale, `/posts/${slug}/history`)}
      locale={locale}
      localeLinks={buildLocaleLinks(`/posts/${slug}`)}
      previewExitPath={buildLocalePath(locale, `/posts/${slug}`)}
      resolved={resolved}
    />
  )
}
