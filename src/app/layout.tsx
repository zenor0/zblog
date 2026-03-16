import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import React from 'react'

import { defaultLocale, localeCookieName, localeRequestHeaderName, normalizeLocale } from '@/lib/locales'
import { getSiteURL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: getSiteURL(),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const locale =
    normalizeLocale(requestHeaders.get(localeRequestHeaderName)) ??
    normalizeLocale(cookieStore.get(localeCookieName)?.value) ??
    defaultLocale

  return (
    <html lang={locale}>
      <body>{props.children}</body>
    </html>
  )
}
