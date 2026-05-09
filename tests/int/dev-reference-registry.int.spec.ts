import { describe, expect, it } from 'vitest'

import {
  devReferenceSections,
  getDevReferenceItem,
  getDevReferenceItems,
} from '@/lib/dev-reference'

describe('dev reference registry', () => {
  it('exposes design system as the primary reference page', () => {
    const items = getDevReferenceItems()
    const designSystem = getDevReferenceItem('design-system')

    expect(items[0]?.slug).toBe('design-system')
    expect(designSystem?.href).toBe('/dev/design-system')
    expect(designSystem?.status).toBe('foundation')
    expect(getDevReferenceItem('article-blocks')?.href).toBe('/dev/design-system/article-blocks')
  })

  it('groups experimental pages separately from foundation references', () => {
    const experiments = devReferenceSections.find((section) => section.id === 'experiments')

    expect(experiments?.items.map((item) => item.slug)).toContain('article-progress')
    expect(experiments?.items.map((item) => item.slug)).toContain('article-layout')
    expect(experiments?.items.map((item) => item.slug)).toContain('footer-layouts')
    expect(experiments?.items.map((item) => item.slug)).not.toContain('typefaces')
    expect(getDevReferenceItem('article-progress')?.href).toBe('/dev/article-progress')
    expect(getDevReferenceItem('article-layout')?.href).toBe('/dev/article-layout')
    expect(getDevReferenceItem('footer-layouts')?.href).toBe('/dev/footer-layouts')
    expect(getDevReferenceItem('typefaces')).toBeNull()
  })
})
