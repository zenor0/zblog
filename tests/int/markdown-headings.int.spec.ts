import { describe, expect, it } from 'vitest'

import { extractMarkdownHeadings } from '@/features/article/model/markdown-headings'

describe('markdown heading extraction', () => {
  it('adds hierarchical display numbers to article body headings', () => {
    const headings = extractMarkdownHeadings(`
# Document title

## Opening

### Background

#### Detail

### Constraints

## Execution

#### Deep detail

### Follow-up

##### Appendix note
`)

    expect(
      headings.map((heading) => ({
        depth: heading.depth,
        number: heading.displayNumber,
        text: heading.text,
      })),
    ).toEqual([
      { depth: 1, number: undefined, text: 'Document title' },
      { depth: 2, number: '1', text: 'Opening' },
      { depth: 3, number: '1.1', text: 'Background' },
      { depth: 4, number: '1.1.1', text: 'Detail' },
      { depth: 3, number: '1.2', text: 'Constraints' },
      { depth: 2, number: '2', text: 'Execution' },
      { depth: 4, number: '2.1.1', text: 'Deep detail' },
      { depth: 3, number: '2.2', text: 'Follow-up' },
      { depth: 5, number: undefined, text: 'Appendix note' },
    ])
  })

  it('keeps setext heading anchors while numbering only h2', () => {
    const headings = extractMarkdownHeadings(`
Title
=====

Section
-------
`)

    expect(headings).toEqual([
      {
        depth: 1,
        id: 'title',
        text: 'Title',
      },
      {
        depth: 2,
        displayNumber: '1',
        id: 'section',
        text: 'Section',
      },
    ])
  })
})
