import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

function getRuleBody(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`))

  return match?.[1] ?? ''
}

describe('site header alignment styles', () => {
  it('right-aligns header nav tabs away from the brand column', () => {
    const editorialCSS = readFileSync('src/styles/frontend/editorial.css', 'utf8')
    const devCSS = readFileSync('src/styles/frontend/dev.css', 'utf8')

    expect(getRuleBody(editorialCSS, '.site-header__nav')).toContain('justify-end')
    expect(getRuleBody(devCSS, '.site-shell-candidate-header__nav')).toContain('justify-end')
  })
})
