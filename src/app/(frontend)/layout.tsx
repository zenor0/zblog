import { Newsreader, Source_Sans_3 } from 'next/font/google'
import React from 'react'

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

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <div className={`${sans.variable} ${serif.variable}`} data-editorial-shell="true">
      <main>{children}</main>
    </div>
  )
}
