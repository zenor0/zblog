'use client'

import { MonitorIcon, MoonIcon, SunIcon, SunMoonIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import {
  applyFrontendTheme,
  isFrontendTheme,
  readStoredFrontendTheme,
  systemThemeQuery,
  themeStorageKey,
  type FrontendTheme,
} from './theme'

type ThemeSwitcherLabels = {
  auto: string
  dark: string
  light: string
}

const defaultLabels: ThemeSwitcherLabels = {
  auto: '跟随系统',
  dark: '深色',
  light: '浅色',
}

function getInitialTheme(): FrontendTheme {
  return readStoredFrontendTheme() ?? 'auto'
}

export function ThemeRuntime() {
  useEffect(() => {
    const syncTheme = () => {
      applyFrontendTheme(readStoredFrontendTheme() ?? 'auto')
    }
    const mediaQuery =
      typeof window.matchMedia === 'function' ? window.matchMedia(systemThemeQuery) : null

    syncTheme()
    mediaQuery?.addEventListener('change', syncTheme)
    window.addEventListener('storage', syncTheme)

    return () => {
      mediaQuery?.removeEventListener('change', syncTheme)
      window.removeEventListener('storage', syncTheme)
    }
  }, [])

  return null
}

export function ThemeSwitcher(props: {
  className?: string
  label?: string
  labels?: Partial<ThemeSwitcherLabels>
}) {
  const { className, label = '主题', labels: labelsProp } = props
  const labels = { ...defaultLabels, ...labelsProp }
  const [theme, setTheme] = useState<FrontendTheme>(getInitialTheme)

  useEffect(() => {
    applyFrontendTheme(theme)

    if (theme !== 'auto' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia(systemThemeQuery)
    const syncSystemTheme = () => {
      applyFrontendTheme('auto')
    }

    mediaQuery.addEventListener('change', syncSystemTheme)

    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme)
    }
  }, [theme])

  return (
    <div className={cn('flex items-center justify-end', className)} data-theme-switcher="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={label}
            className="border border-border"
            size="icon-sm"
            title={label}
            variant="ghost"
          >
            <SunMoonIcon data-icon="inline-start" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" sideOffset={8}>
          <DropdownMenuLabel className="editorial-meta px-2 py-2">{label}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              onValueChange={(value) => {
                if (isFrontendTheme(value)) {
                  setTheme(value)
                }
              }}
              value={theme}
            >
              <DropdownMenuRadioItem value="auto">
                <MonitorIcon />
                {labels.auto}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">
                <SunIcon />
                {labels.light}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon />
                {labels.dark}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { applyFrontendTheme, themeStorageKey }
