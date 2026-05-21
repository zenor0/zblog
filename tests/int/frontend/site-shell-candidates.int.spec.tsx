import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import SiteShellCandidatesPage from '@/app/(frontend)/dev/site-shell-candidates/page'

describe('site shell candidates dev page', () => {
  it('renders the selected editorial header with project index configuration variants', () => {
    const markup = renderToStaticMarkup(<SiteShellCandidatesPage />)

    expect(markup).toContain('data-site-shell-candidates=""')
    expect(markup.match(/data-shell-candidate=/g)).toHaveLength(3)
    expect(markup).toContain('Editorial Bar + Project Index')
    expect(markup).toContain('Editorial Bar + Inline Slogan')
    expect(markup).toContain('Editorial Bar + Two-line Slogan')
    expect(markup).toContain('data-header-tagline-mode="hidden"')
    expect(markup).toContain('data-header-tagline-mode="inline"')
    expect(markup).toContain('data-header-tagline-mode="stacked"')
    expect(markup).toContain('data-header-tool="theme"')
    expect(markup).toContain('data-header-tool="locale"')
    expect(markup).toContain('data-shell-project-index=""')
    expect(markup).not.toContain('Masthead Strip + Project Split')
    expect(markup).not.toContain('Directory Header + Project Index')
    expect(markup).toContain('aria-current="page"')
  })
})
