import { IBM_Plex_Sans, Newsreader } from 'next/font/google'
import React from 'react'
import './styles.css'

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
})

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
})

export const metadata = {
  description: 'A minimal multilingual blog frontend powered by Payload CMS.',
  title: 'ZBlog',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${serif.variable}`}>
        <main className="site-root">{children}</main>
      </body>
    </html>
  )
}
