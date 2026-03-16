import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { requireLocale } from '@/i18n/routing'
import { PostArticle } from '@/components/frontend/PostArticle'
import { buildLocalePath, supportedLocales } from '@/lib/locales'
import { getPostByID } from '@/lib/posts'
import { buildPostAdminPath, buildPostDraftPreviewPath } from '@/lib/preview'
import { getPreviewUser } from '@/lib/preview-user'
import { getSiteSettings } from '@/lib/site-settings'

export async function generateMetadata(props: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const siteSettings = await getSiteSettings(locale)

  return {
    robots: {
      follow: false,
      index: false,
    },
    title: `${article('previewTitle')} | ${siteSettings.siteName}`,
  }
}

export default async function PostPreviewPage(props: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id: idParam, locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const article = await getTranslations({ locale, namespace: 'Article' })
  const preview = await draftMode()

  if (!preview.isEnabled) {
    notFound()
  }

  const previewUser = await getPreviewUser()

  if (!previewUser) {
    notFound()
  }

  const id = Number(idParam)

  if (!Number.isInteger(id)) {
    notFound()
  }

  const resolved = await getPostByID({
    draft: true,
    id,
    locale,
    user: previewUser,
  })

  if (!resolved) {
    notFound()
  }

  return (
    <PostArticle
      backHref={buildPostAdminPath(id)}
      backLabel={article('backToEditor')}
      historyHref={
        resolved.post.slug
          ? buildLocalePath(locale, `/posts/${encodeURIComponent(resolved.post.slug)}/history`)
          : null
      }
      locale={locale}
      localeLinks={supportedLocales.map((item) => ({
        href: buildPostDraftPreviewPath({
          id,
          locale: item.code,
        }),
        label: item.label,
        locale: item.code,
      }))}
      previewExitPath={buildPostAdminPath(id)}
      resolved={resolved}
    />
  )
}
