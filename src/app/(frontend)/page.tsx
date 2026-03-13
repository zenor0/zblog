import { redirect } from 'next/navigation'

import { defaultLocale } from '@/lib/locales'

export default function HomePage() {
  redirect(`/${defaultLocale}`)
}
