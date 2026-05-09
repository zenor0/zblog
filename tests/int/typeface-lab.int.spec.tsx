import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TypefaceLabClient } from '@/app/(frontend)/dev/typefaces/TypefaceLabClient'
import {
  type TypefaceHighlightedCodeSamples,
  typefaceCandidateCriteria,
  typefaceCandidateSchemes,
  typefaceCodeSamples,
  typefaceFontOptions,
} from '@/lib/dev-typefaces'
import { highlightCodeSnippet } from '@/lib/markdown/code-highlighting'

function buildHighlightedCodeSamples(): TypefaceHighlightedCodeSamples {
  return Object.fromEntries(
    typefaceCodeSamples.map((sample) => [
      sample.id,
      highlightCodeSnippet(sample.code, sample.language),
    ]),
  ) as TypefaceHighlightedCodeSamples
}

describe('TypefaceLabClient', () => {
  it('renders a main preview with a side configuration panel', () => {
    render(
      <TypefaceLabClient
        criteria={typefaceCandidateCriteria}
        fontOptions={typefaceFontOptions}
        highlightedCodeSamples={buildHighlightedCodeSamples()}
        schemes={typefaceCandidateSchemes}
      />,
    )

    expect(screen.getByTestId('typeface-main-preview')).toBeTruthy()
    expect(screen.getByRole('complementary', { name: '字体配置' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: /Hybrid Magazine/ }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.getByLabelText('中文字体')).toBeTruthy()
    expect(screen.getByLabelText('西文字体')).toBeTruthy()
    expect(screen.getByLabelText('代码字体')).toBeTruthy()
  })

  it('switches presets, individual fonts, and code language in the preview', () => {
    render(
      <TypefaceLabClient
        criteria={typefaceCandidateCriteria}
        fontOptions={typefaceFontOptions}
        highlightedCodeSamples={buildHighlightedCodeSamples()}
        schemes={typefaceCandidateSchemes}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Technical Journal/ }))
    expect(screen.getByTestId('typeface-main-preview').getAttribute('data-active-preset')).toBe(
      'technical-journal',
    )

    fireEvent.change(screen.getByLabelText('代码字体'), {
      target: { value: 'source-code-pro' },
    })
    expect(screen.getByTestId('typeface-main-preview').getAttribute('style')).toContain(
      '--typeface-code-font',
    )
    expect(screen.getByTestId('typeface-main-preview').getAttribute('style')).toContain(
      'Source Code Pro',
    )

    fireEvent.change(screen.getByLabelText('代码语言'), {
      target: { value: 'json' },
    })

    const codeblock = screen.getByTestId('typeface-codeblock')

    expect(codeblock.getAttribute('data-language')).toBe('json')
    expect(codeblock.innerHTML).toContain('hljs-')
  })
})
