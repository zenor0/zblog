export type FrontendTheme = 'auto' | 'dark' | 'light'

export const themeStorageKey = 'zblog-frontend-theme'
export const systemThemeQuery = '(prefers-color-scheme: dark)'

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
