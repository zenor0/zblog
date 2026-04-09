import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { Newsreader, Source_Sans_3 } from 'next/font/google'
import React from 'react'

import { defaultLocale, localeCookieName, localeRequestHeaderName, normalizeLocale } from '@/lib/locales'
import { getSiteURL } from '@/lib/seo'

import './styles.css'

const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans-ui',
  weight: ['400', '500', '600'],
})

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif-display',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: getSiteURL(),
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const locale =
    normalizeLocale(requestHeaders.get(localeRequestHeaderName)) ??
    normalizeLocale(cookieStore.get(localeCookieName)?.value) ??
    defaultLocale

  return (
    <html lang={locale}>
      <body>
        <div className={`${sans.variable} ${serif.variable}`} data-editorial-shell="true">
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
