import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'

type DevLayoutProps = {
  children: ReactNode
}

export default function DevLayout({ children }: DevLayoutProps) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return children
}
