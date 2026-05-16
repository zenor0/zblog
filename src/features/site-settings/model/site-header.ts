import type { SiteSettings } from '@/features/site-settings/model/site-settings'

export type SiteHeaderTaglineMode = 'hidden' | 'inline' | 'stacked'

export type SiteHeaderConfig = {
  tagline: string | null
  taglineMode: SiteHeaderTaglineMode
}

const taglineModes = new Set<SiteHeaderTaglineMode>(['hidden', 'inline', 'stacked'])

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getCustomVariable(settings: SiteSettings, key: string): string | null {
  const customVariables = settings.globalVariables?.customVariables ?? []
  const variable = customVariables.find((item) => item.key === key)

  return hasText(variable?.value) ? variable.value.trim() : null
}

function getTaglineMode(value: string | null): SiteHeaderTaglineMode {
  return taglineModes.has(value as SiteHeaderTaglineMode)
    ? (value as SiteHeaderTaglineMode)
    : 'hidden'
}

export function getSiteHeaderConfig(settings: SiteSettings): SiteHeaderConfig {
  const fallbackTagline = hasText(settings.siteDescription) ? settings.siteDescription.trim() : null
  const tagline = getCustomVariable(settings, 'tagline') ?? fallbackTagline
  const taglineMode = getTaglineMode(getCustomVariable(settings, 'headerTaglineMode'))

  return {
    tagline,
    taglineMode: tagline ? taglineMode : 'hidden',
  }
}
