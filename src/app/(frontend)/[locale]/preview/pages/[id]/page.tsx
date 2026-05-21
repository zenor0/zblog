import type { Metadata } from 'next'
import { draftMode, headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { PageArticle } from '@/features/pages/ui/PageArticle'
import { getPageByID } from '@/features/pages/server/queries'
import { getPreviewUser } from '@/features/posts/server/preview-user'
import { getSiteSettings } from '@/features/site-settings/model/site-settings'
import { requireLocale } from '@/i18n/routing'
import { getRequestOrigin } from '@/shared/runtime/request-origin'

export async function generateMetadata(props: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
  const siteSettings = await getSiteSettings(locale)

  return {
    robots: {
      follow: false,
      index: false,
    },
    title: `Preview | ${siteSettings.siteName}`,
  }
}

export default async function PagePreviewPage(props: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id: idParam, locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)
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

  const resolved = await getPageByID({
    draft: true,
    id,
    locale,
    user: previewUser,
  })

  if (!resolved) {
    notFound()
  }

  return <PageArticle resolved={resolved} serverURL={getRequestOrigin(await headers())} />
}
