export const localSiteURL = 'http://localhost:3000'

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim()

  return value && value.length > 0 ? value : null
}

export function getPayloadSecret(): string {
  const secret = readEnv('PAYLOAD_SECRET')

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required.')
  }

  return secret
}

export function getCanonicalSiteURLInput(): string {
  const siteURL = readEnv('NEXT_PUBLIC_SITE_URL') ?? readEnv('SITE_URL')

  if (siteURL) {
    return siteURL
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL or SITE_URL is required in production.')
  }

  return localSiteURL
}
