export const localSiteURL = 'http://localhost:3000'

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim()

  return value && value.length > 0 ? value : null
}

export function normalizeCanonicalSiteURLInput(value: null | string | undefined): string | null {
  const input = value?.trim()

  if (!input) {
    return null
  }

  let url: URL

  try {
    url = new URL(input)
  } catch {
    throw new Error('Site URL must be an absolute http or https URL.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Site URL must use http or https.')
  }

  if (url.username || url.password) {
    throw new Error('Site URL must not include credentials.')
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Site URL must be the public origin without a path, query, or hash.')
  }

  return url.origin
}

export function validateCanonicalSiteURL(value: unknown): true | string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return true
  }

  try {
    normalizeCanonicalSiteURLInput(value)

    return true
  } catch (error) {
    return error instanceof Error ? error.message : 'Site URL is invalid.'
  }
}

export function getPayloadSecret(): string {
  const secret = readEnv('PAYLOAD_SECRET')

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required.')
  }

  return secret
}

export function getCanonicalSiteURLInput(siteURLInput?: null | string): string {
  const siteURL =
    normalizeCanonicalSiteURLInput(siteURLInput) ??
    normalizeCanonicalSiteURLInput(readEnv('SITE_URL')) ??
    normalizeCanonicalSiteURLInput(readEnv('NEXT_PUBLIC_SITE_URL'))

  if (siteURL) {
    return siteURL
  }

  return localSiteURL
}
