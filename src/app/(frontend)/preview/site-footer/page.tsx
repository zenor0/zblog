import type { Metadata } from 'next'

import { SiteFooterPreviewFrame } from '@/components/frontend/SiteFooterPreviewFrame'
import { resolveSiteFooterPreviewLocale } from '@/lib/site-footer-preview'

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Footer Preview',
}

export default async function SiteFooterPreviewPage(props: {
  searchParams: Promise<{
    locale?: string
  }>
}) {
  const searchParams = await props.searchParams
  const locale = resolveSiteFooterPreviewLocale(searchParams.locale)

  return <SiteFooterPreviewFrame initialLocale={locale} />
}
