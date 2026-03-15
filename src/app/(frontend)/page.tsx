import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { buildLocalePath, resolvePreferredLocale } from '@/lib/locales'

export default async function HomePage() {
  const requestHeaders = await headers()
  const locale = resolvePreferredLocale(requestHeaders.get('accept-language'))

  redirect(buildLocalePath(locale))
}
