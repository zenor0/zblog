import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { getFrontendCopy, requireLocale } from '@/app/(frontend)/helpers'
import { PostArticle } from '@/components/frontend/PostArticle'
import { buildLocalePath, supportedLocales } from '@/lib/locales'
import { getPostByID } from '@/lib/posts'
import { buildPostAdminPath, buildPostDraftPreviewPath } from '@/lib/preview'
import { getPreviewUser } from '@/lib/preview-user'

export default async function PostPreviewPage(props: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id: idParam, locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getFrontendCopy(locale)
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
      backLabel={copy.backToEditor}
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
