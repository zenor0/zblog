import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { PostLivePreviewRefresh } from '@/features/posts/ui/PostLivePreviewRefresh'
import { PostArticle } from '@/features/posts/ui/PostArticle'
import { getPostByID } from '@/features/posts/server/queries'
import { getPreviewUser } from '@/features/posts/server/preview-user'
import { buildPostAdminPath, buildPostDraftPreviewPath } from '@/features/posts/preview'
import { getSiteSettings } from '@/features/site-settings/model/site-settings'
import { requireLocale } from '@/i18n/routing'
import { getRequestOrigin } from '@/shared/runtime/request-origin'
import { buildLocalePath, supportedLocales } from '@/shared/i18n/locales'

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

  const serverURL = getRequestOrigin(await headers())

  return (
    <>
      <PostLivePreviewRefresh serverURL={serverURL} />
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
    </>
  )
}
