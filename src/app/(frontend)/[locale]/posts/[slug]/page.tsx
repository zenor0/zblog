import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { buildLocaleLinks, getFrontendCopy, requireLocale } from '@/app/(frontend)/helpers'
import { PostArticle } from '@/components/frontend/PostArticle'
import { buildLocalePath } from '@/lib/locales'
import { getPostBySlug } from '@/lib/posts'
import { getPreviewUser } from '@/lib/preview-user'

export default async function PostPage(props: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await props.params
  const locale = requireLocale(localeParam)
  const copy = getFrontendCopy(locale)
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
      backLabel={copy.backToIndex}
      historyHref={buildLocalePath(locale, `/posts/${slug}/history`)}
      locale={locale}
      localeLinks={buildLocaleLinks(`/posts/${slug}`)}
      previewExitPath={buildLocalePath(locale, `/posts/${slug}`)}
      resolved={resolved}
    />
  )
}
