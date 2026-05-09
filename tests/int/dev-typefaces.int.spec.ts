import { describe, expect, it } from 'vitest'

import { getDevReferenceItem } from '@/lib/dev-reference'
import { typefaceCandidateSchemes } from '@/lib/dev-typefaces'

describe('dev typeface candidates', () => {
  it('adds a development reference entry for the typeface comparison page', () => {
    expect(getDevReferenceItem('typefaces')).toMatchObject({
      href: '/dev/typefaces',
      status: 'experiment',
      title: 'Typeface Candidates',
    })
  })

  it('defines complete typography candidates for Chinese, Latin, and code samples', () => {
    expect(typefaceCandidateSchemes).toHaveLength(4)
    expect(typefaceCandidateSchemes.map((scheme) => scheme.id)).toEqual([
      'serif-editorial',
      'hybrid-magazine',
      'system-songti',
      'technical-journal',
    ])

    for (const scheme of typefaceCandidateSchemes) {
      expect(scheme.fonts.heading).toContain('var(')
      expect(scheme.fonts.body).toContain('SC')
      expect(scheme.fonts.code).toMatch(/Mono|Code|SFMono/)
      expect(scheme.weights.strong).toBeGreaterThan(scheme.weights.body)
      expect(scheme.samples.code).toContain('export function')
    }
  })
})
