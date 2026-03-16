import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { buildLocalePath, localeCookieName, normalizeLocale, resolvePreferredLocale } from '@/lib/locales'

export default async function HomePage() {
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const locale =
    normalizeLocale(cookieStore.get(localeCookieName)?.value) ??
    resolvePreferredLocale(requestHeaders.get('accept-language'))

  redirect(buildLocalePath(locale))
}
