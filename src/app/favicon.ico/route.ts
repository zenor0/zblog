import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { buildPageTitle, getSiteURL } from '@/shared/content/seo'
import { defaultLocale } from '@/shared/i18n/locales'
import { defaultSiteName } from '@/shared/site/defaults'

type MediaLike = {
  url?: null | string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function escapeXML(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function getMediaURL(value: unknown): null | string {
  if (!isRecord(value)) {
    return null
  }

  const url = (value as MediaLike).url?.trim()

  return url && url.length > 0 ? url : null
}

function getFaviconInitials(siteName: string) {
  const words = siteName.trim().split(/\s+/).filter(Boolean)
  const initials =
    words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => word[0])
          .join('')
      : siteName.trim().slice(0, 2)

  return initials.toUpperCase() || 'PB'
}

function buildFallbackFaviconSVG(siteName: string) {
  const label = buildPageTitle({
    pageTitle: null,
    siteName,
  })
  const safeLabel = escapeXML(label)
  const initials = escapeXML(getFaviconInitials(label))

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-labelledby="title">
  <title id="title">${safeLabel}</title>
  <rect width="32" height="32" rx="7" fill="#111318"/>
  <text x="16" y="20.5" fill="#f4f0e8" font-family="Arial, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${initials}</text>
</svg>`
}

async function resolveConfiguredFavicon() {
  try {
    const settings = await getResolvedSiteSettings(defaultLocale)
    const iconURL = getMediaURL(settings.globalVariables?.assets?.icon)

    return {
      iconURL,
      siteName: settings.siteName || defaultSiteName,
      siteURL: settings.siteURL,
    }
  } catch {
    return {
      iconURL: null,
      siteName: defaultSiteName,
      siteURL: null,
    }
  }
}

export async function GET() {
  const favicon = await resolveConfiguredFavicon()

  if (favicon.iconURL) {
    return Response.redirect(new URL(favicon.iconURL, getSiteURL(favicon.siteURL)).toString(), 307)
  }

  return new Response(buildFallbackFaviconSVG(favicon.siteName), {
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'image/svg+xml; charset=utf-8',
    },
  })
}
