import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import {
  JetBrains_Mono,
  Newsreader,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Source_Sans_3,
} from 'next/font/google'
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

const code = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-code',
  weight: ['400', '500', '600'],
})

const cjkSans = Noto_Sans_SC({
  display: 'swap',
  preload: false,
  variable: '--font-cjk-sans',
  weight: ['400', '500', '600', '700'],
})

const cjkSerif = Noto_Serif_SC({
  display: 'swap',
  preload: false,
  variable: '--font-cjk-serif',
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
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: frontendThemeInitScript }} />
      </head>
      <body>
        <ThemeRuntime />
        <div
          className={[
            sans.variable,
            serif.variable,
            code.variable,
            cjkSans.variable,
            cjkSerif.variable,
          ].join(' ')}
          data-editorial-shell="true"
        >
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
