import { IBM_Plex_Sans, Newsreader } from 'next/font/google'
import React from 'react'

import './styles.css'

const sans = IBM_Plex_Sans({
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
    <div className={`${sans.variable} ${serif.variable}`}>
      <main>{children}</main>
    </div>
  )
}
