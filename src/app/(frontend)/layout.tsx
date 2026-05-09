import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { IBM_Plex_Mono, Newsreader, Source_Sans_3 } from 'next/font/google'
import React from 'react'

import { ThemeRuntime } from '@/components/frontend/ThemeSwitcher'
import { frontendThemeInitScript } from '@/components/frontend/theme'
import {
  defaultLocale,
  localeCookieName,
  localeRequestHeaderName,
  normalizeLocale,
} from '@/lib/locales'
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

const code = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-code',
  weight: ['400', '500'],
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: frontendThemeInitScript }} />
      </head>
      <body>
        <ThemeRuntime />
        <div
          className={`${sans.variable} ${serif.variable} ${code.variable}`}
          data-editorial-shell="true"
        >
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
