import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SiteHeader } from '@/features/site-settings/ui/SiteHeader'

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

vi.mock('next/navigation', () => ({
  usePathname: () => '/zh-hans/projects/zblog-project-system',
  useSelectedLayoutSegment: () => 'projects',
}))

describe('SiteHeader', () => {
  it('renders a global editorial bar with route active state and icon controls', async () => {
    render(
      <SiteHeader
        activeLocale="zh-Hans"
        homeHref="/zh-hans"
        labels={{
          localeNavigation: '语言',
          navLabel: '站点导航',
          themeAuto: '跟随系统',
          themeDark: '深色',
          themeLight: '浅色',
          themeNavigation: '主题',
        }}
        navItems={[
          {
            href: '/zh-hans/posts',
            label: '文章',
            segment: 'posts',
          },
          {
            href: '/zh-hans/projects',
            label: '项目',
            segment: 'projects',
          },
          {
            href: '/zh-hans/about',
            label: '关于',
            segment: 'about',
          },
        ]}
        siteName="ZBlog"
        tagline="技术、产品与日常工作"
        taglineMode="inline"
      />,
    )

    expect(screen.getByRole('banner').getAttribute('data-header-tagline-mode')).toBe('inline')
    expect(screen.getByRole('link', { name: '项目' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: '主题' }).textContent).toBe('')
    expect(screen.getByRole('button', { name: '语言' }).textContent).toBe('')

    fireEvent.pointerDown(screen.getByRole('button', { name: '语言' }), {
      button: 0,
      ctrlKey: false,
    })

    expect((await screen.findByRole('menuitem', { name: 'English' })).getAttribute('href')).toBe(
      '/en/projects/zblog-project-system',
    )
  })
})
