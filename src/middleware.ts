import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { buildLocalePath, getLocaleSlug, resolveLocaleDefinition, resolvePreferredLocale } from '@/lib/locales'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const locale = resolvePreferredLocale(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()

    url.pathname = buildLocalePath(locale)

    return NextResponse.redirect(url)
  }

  const [, firstSegment, ...remainingSegments] = pathname.split('/')
  const resolvedLocale = resolveLocaleDefinition(firstSegment)

  if (!resolvedLocale) {
    return NextResponse.next()
  }

  if (firstSegment === resolvedLocale.slug) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()

  url.pathname = `/${getLocaleSlug(resolvedLocale.code)}${remainingSegments.length ? `/${remainingSegments.join('/')}` : ''}`

  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!admin|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
