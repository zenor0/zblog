import { describe, expect, it } from 'vitest'

import {
  describeBibliographyEntry,
  parseBibliography,
  parseEditableBibliography,
  getReferencedEntries,
  readBibliographySource,
  serializeEditableBibliography,
} from '@/lib/bibliography'
import { buildCitationIndex, extractCitationKeys } from '@/lib/citations'
import { buildTextDiff } from '@/lib/diff'
import { extractMarkdownMediaSources } from '@/lib/markdown'

const sampleBibliography = `
@article{smith2024,
  author = {Smith, Jane and Doe, John},
  title = {A {Useful} Paper},
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

@online{openai2025,
  author = {{OpenAI}},
  title = {The {AI} Handbook},
  url = {https://example.com/docs},
  urldate = {2025-01-05},
  year = {2025}
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

  it('extracts markdown media sources in first-seen order', () => {
    const markdown = `
![Hero](/media/hero.png "Hero caption")
![PDF](/api/media/file/paper.pdf)
![Hero again](/media/hero.png)
`

    expect(extractMarkdownMediaSources(markdown)).toEqual([
      '/media/hero.png',
      '/api/media/file/paper.pdf',
    ])
  })

  it('parses bibliography entries and resolves referenced items', () => {
    const entries = parseBibliography(sampleBibliography)

    expect(entries).toHaveLength(3)
    expect(entries[0]?.citationKey).toBe('smith2024')
    expect(entries[0]?.title).toBe('A Useful Paper')
    expect(entries[0]?.journalTitle).toBe('Journal of Blogging')
    expect(entries[0]?.issued?.year).toBe('2024')
    expect(entries[0]?.pages).toBe('10-20')

    const resolved = getReferencedEntries('Intro [@smith2024; @missing2022].', entries)

    expect(resolved.entries.map((entry) => entry.citationKey)).toEqual(['smith2024'])
    expect(resolved.missingKeys).toEqual(['missing2022'])
  })

  it('normalizes BibLaTeX entries into a display-friendly structure', () => {
    const entries = parseBibliography(sampleBibliography)
    const openAIEntry = entries.find((entry) => entry.citationKey === 'openai2025')

    expect(openAIEntry).toBeDefined()
    expect(openAIEntry?.authors[0]?.literal).toBe('OpenAI')
    expect(openAIEntry?.title).toBe('The AI Handbook')
    expect(openAIEntry?.url).toBe('https://example.com/docs')
    expect(openAIEntry?.accessed?.literal).toBe('2025-01-05')

    const display = describeBibliographyEntry(openAIEntry!)

    expect(display.creators).toBe('OpenAI')
    expect(display.title).toBe('The AI Handbook')
    expect(display.year).toBe('2025')
    expect(display.links).toEqual([
      {
        href: 'https://example.com/docs',
        label: 'URL',
        value: 'https://example.com/docs',
      },
    ])
  })

  it('reads bibliography text directly from the stored source field', async () => {
    await expect(readBibliographySource({ source: sampleBibliography })).resolves.toContain(
      '@article{smith2024',
    )
  })

  it('derives structured editable entries and serializes them back to BibTeX', () => {
    const editable = parseEditableBibliography(sampleBibliography)

    expect(editable.isFullyEditable).toBe(true)
    expect(editable.issues).toEqual([])
    expect(editable.entries).toHaveLength(3)
    expect(editable.entries[0]).toMatchObject({
      citationKey: 'smith2024',
      date: '2024',
      entryType: 'article',
      title: 'A Useful Paper',
    })
    expect(editable.entries[0]?.authors).toEqual([
      {
        family: 'Smith',
        given: 'Jane',
        literal: '',
        prefix: '',
        suffix: '',
        usePrefix: false,
      },
      {
        family: 'Doe',
        given: 'John',
        literal: '',
        prefix: '',
        suffix: '',
        usePrefix: false,
      },
    ])

    const serialized = serializeEditableBibliography(editable.entries)

    expect(serialized).toContain('@article{smith2024,')
    expect(serialized).toContain('author = {Smith, Jane and Doe, John}')
    expect(serialized).toContain('journaltitle = {Journal of Blogging}')
    expect(serialized).toContain('@online{openai2025,')
  })

  it('marks unsupported bibliography shapes as raw-only', () => {
    const unsupported = parseEditableBibliography(`
@article{complex2025,
  author = {Doe, Jamie},
  title = {Complex Entry},
  abstract = {Not part of the structured editor surface},
  year = {2025}
}
`)

    expect(unsupported.isFullyEditable).toBe(false)
    expect(unsupported.issues[0]).toContain('complex2025')
    expect(unsupported.entries[0]?.citationKey).toBe('complex2025')
  })

  it('serializes editable entries with normalized fallback citation keys', () => {
    const serialized = serializeEditableBibliography([
      {
        accessed: '',
        authors: [],
        bookTitle: '',
        citationKey: '  @MixedKey  ',
        date: '',
        doi: '',
        editors: [],
        entryType: 'misc',
        eventTitle: '',
        institution: '',
        journalTitle: '',
        location: '',
        note: '',
        number: '',
        organization: '',
        pages: '',
        publisher: '',
        school: '',
        seriesTitle: '',
        subtitle: '',
        title: 'Normalized Key',
        translators: [],
        url: '',
        venue: '',
        volume: '',
      },
      {
        accessed: '',
        authors: [],
        bookTitle: '',
        citationKey: '',
        date: '',
        doi: '',
        editors: [],
        entryType: 'misc',
        eventTitle: '',
        institution: '',
        journalTitle: '',
        location: '',
        note: '',
        number: '',
        organization: '',
        pages: '',
        publisher: '',
        school: '',
        seriesTitle: '',
        subtitle: '',
        title: 'Fallback Key',
        translators: [],
        url: '',
        venue: '',
        volume: '',
      },
    ])

    expect(serialized).toContain('@misc{mixedkey,')
    expect(serialized).toContain('@misc{reference-2,')
  })

  it('builds line-based text diffs', () => {
    const diff = buildTextDiff('old line\nsame line', 'new line\nsame line')

    expect(diff.some((line) => line.type === 'removed' && line.value.includes('old line'))).toBe(true)
    expect(diff.some((line) => line.type === 'added' && line.value.includes('new line'))).toBe(true)
  })
})
