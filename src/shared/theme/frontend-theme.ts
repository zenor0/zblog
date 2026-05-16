import type { CSSProperties } from 'react'

export type FrontendTheme = 'auto' | 'dark' | 'light'

export type FrontendAccentColorPreset = {
  label: string
  preview: `#${string}`
  value: string
}

export const themeStorageKey = 'zblog-frontend-theme'
export const systemThemeQuery = '(prefers-color-scheme: dark)'
export const defaultFrontendAccentColor = 'oklch(0.62 0.14 190)'
export const frontendAccentColorPresets = [
  {
    label: 'Teal',
    preview: '#14b8a6',
    value: defaultFrontendAccentColor,
  },
  {
    label: 'Cyan',
    preview: '#0ea5e9',
    value: 'oklch(0.64 0.14 220)',
  },
  {
    label: 'Indigo',
    preview: '#6366f1',
    value: 'oklch(0.58 0.16 275)',
  },
  {
    label: 'Rose',
    preview: '#e11d48',
    value: 'oklch(0.62 0.17 15)',
  },
  {
    label: 'Amber',
    preview: '#d97706',
    value: 'oklch(0.72 0.15 75)',
  },
  {
    label: 'Moss',
    preview: '#16a34a',
    value: 'oklch(0.6 0.12 145)',
  },
] as const satisfies readonly FrontendAccentColorPreset[]

const cssNumber = String.raw`[-+]?(?:\d+|\d*\.\d+)`
const cssPercentage = String.raw`${cssNumber}%`
const cssNumberOrPercentage = String.raw`(?:${cssNumber}|${cssPercentage})`
const safeHexColorPattern = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const safeOklchColorPattern = new RegExp(
  String.raw`^oklch\(\s*${cssNumberOrPercentage}\s+${cssNumber}\s+${cssNumber}(?:deg|rad|turn)?(?:\s*/\s*${cssNumberOrPercentage})?\s*\)$`,
  'i',
)
const unsafeCssColorPattern = /[;"'{}<>\\]|\b(?:url|var|calc|env|attr|expression|import)\s*\(/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateFrontendAccentColor(value: unknown): true | string {
  if (value == null || value === '') {
    return true
  }

  if (typeof value !== 'string') {
    return 'Accent color must be a CSS color string.'
  }

  const color = value.trim()

  if (color.length === 0) {
    return true
  }

  if (unsafeCssColorPattern.test(color)) {
    return 'Accent color cannot contain CSS functions, URLs, or declaration syntax.'
  }

  if (safeHexColorPattern.test(color) || safeOklchColorPattern.test(color)) {
    return true
  }

  return 'Use a hex color like #14b8a6 or an oklch() color like oklch(0.62 0.14 190).'
}

export function resolveFrontendAccentColor(settings: unknown): string {
  const appearance = isRecord(settings) && isRecord(settings.appearance) ? settings.appearance : {}
  const value = appearance.accentColor

  return validateFrontendAccentColor(value) === true && typeof value === 'string' && value.trim()
    ? value.trim()
    : defaultFrontendAccentColor
}

export function resolveFrontendAccentStyle(settings: unknown): CSSProperties {
  return {
    '--zblog-accent': resolveFrontendAccentColor(settings),
  } as CSSProperties
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getSystemTheme(): Exclude<FrontendTheme, 'auto'> {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light'
}

export function isFrontendTheme(value: string): value is FrontendTheme {
  return value === 'auto' || value === 'dark' || value === 'light'
}

export function readStoredFrontendTheme(): Exclude<FrontendTheme, 'auto'> | null {
  const storage = getBrowserStorage()

  if (!storage) {
    return null
  }

  const value = storage.getItem(themeStorageKey)

  return value === 'dark' || value === 'light' ? value : null
}

export function applyFrontendTheme(theme: FrontendTheme): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const storage = getBrowserStorage()
  const appliedTheme = theme === 'auto' ? getSystemTheme() : theme

  if (theme === 'auto') {
    delete root.dataset.zblogTheme
    storage?.removeItem(themeStorageKey)
  } else {
    root.dataset.zblogTheme = theme
    storage?.setItem(themeStorageKey, theme)
  }

  root.classList.toggle('dark', appliedTheme === 'dark')
  root.style.colorScheme = appliedTheme
}

export const frontendThemeInitScript = `(() => {
  try {
    const storageKey = '${themeStorageKey}'
    const query = '${systemThemeQuery}'
    const root = document.documentElement
    const storedTheme = window.localStorage.getItem(storageKey)
    const explicitTheme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null
    const systemTheme =
      typeof window.matchMedia === 'function' && window.matchMedia(query).matches ? 'dark' : 'light'
    const appliedTheme = explicitTheme || systemTheme

    if (explicitTheme) {
      root.dataset.zblogTheme = explicitTheme
    } else {
      delete root.dataset.zblogTheme
    }

    root.classList.toggle('dark', appliedTheme === 'dark')
    root.style.colorScheme = appliedTheme
  } catch (error) {}
})()`
