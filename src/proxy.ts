import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  buildLocalePath,
  getLocaleSlug,
  localeCookieName,
  localeRequestHeaderName,
  normalizeLocale,
  resolvePreferredLocale,
} from '@/shared/i18n/locales'

const localeCookieMaxAge = 60 * 60 * 24 * 365

function persistLocale(response: NextResponse, locale: string) {
  response.cookies.set(localeCookieName, locale, {
    maxAge: localeCookieMaxAge,
    path: '/',
    sameSite: 'lax',
  })
  response.headers.set('Content-Language', locale)

  return response
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookieLocale = normalizeLocale(request.cookies.get(localeCookieName)?.value)

  if (pathname === '/') {
    const locale = cookieLocale ?? resolvePreferredLocale(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()

    url.pathname = buildLocalePath(locale)

    const response = NextResponse.redirect(url)
    response.headers.set('Vary', 'Accept-Language, Cookie')

    return response
  }

  const [, firstSegment, ...remainingSegments] = pathname.split('/')
  const normalizedLocale = normalizeLocale(firstSegment)

  if (!normalizedLocale) {
    return NextResponse.next()
  }

  const canonicalSlug = getLocaleSlug(normalizedLocale)
  const requestHeaders = new Headers(request.headers)

  requestHeaders.set(localeRequestHeaderName, normalizedLocale)

  if (firstSegment === canonicalSlug) {
    return persistLocale(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
      normalizedLocale,
    )
  }

  const url = request.nextUrl.clone()

  url.pathname = `/${canonicalSlug}${remainingSegments.length ? `/${remainingSegments.join('/')}` : ''}`

  return persistLocale(NextResponse.redirect(url), normalizedLocale)
}

export const config = {
  matcher: ['/((?!admin|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
