import { getSiteURL } from '@/shared/content/seo'

function readForwardedHeader(requestHeaders: Headers, name: string) {
  const value = requestHeaders.get(name)

  if (!value) {
    return null
  }

  const [firstValue] = value.split(',')
  const normalized = firstValue?.trim()

  return normalized || null
}

export function getRequestOrigin(requestHeaders: Headers) {
  const host = readForwardedHeader(requestHeaders, 'x-forwarded-host') ?? readForwardedHeader(requestHeaders, 'host')

  if (!host) {
    return getSiteURL().origin
  }

  const protocol =
    readForwardedHeader(requestHeaders, 'x-forwarded-proto') ??
    (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')

  return `${protocol}://${host}`
}
