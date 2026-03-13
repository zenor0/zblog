import { describe, expect, it } from 'vitest'

import { parseBibliography, getReferencedEntries, readBibliographySource } from '@/lib/bibliography'
import { buildCitationIndex, extractCitationKeys } from '@/lib/citations'
import { buildTextDiff } from '@/lib/diff'

const sampleBibliography = `
@article{smith2024,
  author = {Smith, Jane and Doe, John},
  title = {A Useful Paper},
  journal = {Journal of Blogging},
  year = {2024},
  volume = {12},
  number = {3},
  pages = {10-20}
}

@inproceedings{chen2023,
  author = {Chen, Alice},
  title = {Payload in Practice},
  booktitle = {Proceedings of the Example Conference},
  year = {2023}
}
`

describe('content utilities', () => {
  it('extracts citation keys in first-seen order', () => {
    const markdown = 'See [@smith2024] and [@chen2023; @smith2024] for details. Cross-ref [@fig:overview].'

    expect(extractCitationKeys(markdown)).toEqual(['smith2024', 'chen2023'])
    expect(Array.from(buildCitationIndex(markdown).entries())).toEqual([
      ['smith2024', 1],
      ['chen2023', 2],
    ])
  })

  it('parses bibliography entries and resolves referenced items', () => {
    const entries = parseBibliography(sampleBibliography)

    expect(entries).toHaveLength(2)
    expect(entries[0]?.citationKey).toBe('smith2024')
    expect(entries[0]?.formatted).toContain('A Useful Paper')

    const resolved = getReferencedEntries('Intro [@smith2024; @missing2022].', entries)

    expect(resolved.entries.map((entry) => entry.citationKey)).toEqual(['smith2024'])
    expect(resolved.missingKeys).toEqual(['missing2022'])
  })

  it('reads bibliography text directly from the stored source field', async () => {
    await expect(readBibliographySource({ source: sampleBibliography })).resolves.toContain(
      '@article{smith2024',
    )
  })

  it('builds line-based text diffs', () => {
    const diff = buildTextDiff('old line\nsame line', 'new line\nsame line')

    expect(diff.some((line) => line.type === 'removed' && line.value.includes('old line'))).toBe(true)
    expect(diff.some((line) => line.type === 'added' && line.value.includes('new line'))).toBe(true)
  })
})
