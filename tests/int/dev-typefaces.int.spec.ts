import { describe, expect, it } from 'vitest'

import { getDevReferenceItem } from '@/lib/dev-reference'
import {
  typefaceCandidateSchemes,
  typefaceCodeSamples,
  typefaceFontOptions,
} from '@/lib/dev-typefaces'

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
      expect(scheme.settings.cjkFont).toBeTruthy()
      expect(scheme.settings.latinFont).toBeTruthy()
      expect(scheme.settings.codeFont).toBeTruthy()
      expect(scheme.weights.strong).toBeGreaterThan(scheme.weights.body)
      expect(scheme.samples.code).toContain('export function')
    }
  })

  it('offers commercially usable font choices for interactive comparison', () => {
    expect(typefaceFontOptions.cjk).toHaveLength(5)
    expect(typefaceFontOptions.latin).toHaveLength(5)
    expect(typefaceFontOptions.code).toHaveLength(4)

    for (const option of [
      ...typefaceFontOptions.cjk,
      ...typefaceFontOptions.latin,
      ...typefaceFontOptions.code,
    ]) {
      expect(option.stack).toContain(option.family)
      expect(option.license).toMatch(/OFL|Apache/)
      expect(option.commercialUse).toBe(true)
    }
  })

  it('defines multiple language samples for code highlighting previews', () => {
    expect(typefaceCodeSamples.map((sample) => sample.id)).toEqual(['tsx', 'json', 'bash', 'css'])
    expect(typefaceCodeSamples.every((sample) => sample.code.trim().length > 0)).toBe(true)
  })
})
