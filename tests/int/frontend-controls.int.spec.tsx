import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocaleSwitcher } from '@/components/frontend/LocaleSwitcher'
import {
  applyFrontendTheme,
  ThemeSwitcher,
  themeStorageKey,
} from '@/components/frontend/ThemeSwitcher'

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

afterEach(() => {
  delete document.documentElement.dataset.zblogTheme
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  window.localStorage.clear()
})

describe('LocaleSwitcher', () => {
  it('opens locale choices from an icon-only dropdown trigger', async () => {
    render(
      <LocaleSwitcher
        activeLocale="zh-Hans"
        items={[
          { href: '/zh-hans', label: '简体中文', locale: 'zh-Hans' },
          { href: '/en', label: 'English', locale: 'en' },
        ]}
        label="语言"
      />,
    )

    const trigger = screen.getByRole('button', { name: '语言' })

    expect(trigger.textContent).toBe('')
    expect(screen.queryByRole('menu')).toBeNull()

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })

    const menu = await screen.findByRole('menu')
    expect(menu.textContent).toContain('简体中文')
    expect(menu.textContent).toContain('English')
    expect(screen.getByRole('menuitem', { name: '简体中文' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(screen.getByRole('menuitem', { name: 'English' }).getAttribute('href')).toBe('/en')
  })
})

describe('ThemeSwitcher', () => {
  it('applies and persists explicit dark and light themes', () => {
    applyFrontendTheme('dark')

    expect(document.documentElement.dataset.zblogTheme).toBe('dark')
    expect(window.localStorage.getItem(themeStorageKey)).toBe('dark')

    applyFrontendTheme('light')

    expect(document.documentElement.dataset.zblogTheme).toBe('light')
    expect(window.localStorage.getItem(themeStorageKey)).toBe('light')
  })

  it('clears the explicit theme when automatic mode is selected', () => {
    applyFrontendTheme('dark')
    applyFrontendTheme('auto')

    expect(document.documentElement.dataset.zblogTheme).toBeUndefined()
    expect(window.localStorage.getItem(themeStorageKey)).toBeNull()
  })

  it('offers automatic, light, and dark options from an icon trigger', async () => {
    render(<ThemeSwitcher label="主题" />)

    const trigger = screen.getByRole('button', { name: '主题' })

    expect(trigger.textContent).toBe('')

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false })

    expect(
      (await screen.findByRole('menuitemradio', { name: '跟随系统' })).getAttribute('aria-checked'),
    ).toBe('true')

    fireEvent.click(screen.getByRole('menuitemradio', { name: '深色' }))

    await waitFor(() => {
      expect(document.documentElement.dataset.zblogTheme).toBe('dark')
      expect(window.localStorage.getItem(themeStorageKey)).toBe('dark')
    })
  })
})
