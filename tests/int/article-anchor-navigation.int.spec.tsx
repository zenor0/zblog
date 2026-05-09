import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ArticleAnchorNavigation } from '@/components/frontend/ArticleAnchorNavigation'

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value,
  })
}

function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

describe('ArticleAnchorNavigation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('smoothly jumps to article anchors and exposes a return button', () => {
    setReducedMotion(false)
    setScrollY(420)

    const scrollIntoView = vi.fn()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    render(
      <>
        <a href="#target-section">Jump</a>
        <section
          id="target-section"
          ref={(node) => {
            if (node) {
              node.scrollIntoView = scrollIntoView
            }
          }}
        >
          Target
        </section>
        <ArticleAnchorNavigation returnLabel="Return to reading position" />
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Jump' }))

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })

    const returnButton = screen.getByRole('button', { name: 'Return to reading position' })

    fireEvent.click(returnButton)

    expect(scrollTo).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 420,
    })
  })

  it('disables smooth scrolling when the user prefers reduced motion', () => {
    setReducedMotion(true)
    setScrollY(120)

    const scrollIntoView = vi.fn()

    render(
      <>
        <a href="#target-section">Jump</a>
        <section
          id="target-section"
          ref={(node) => {
            if (node) {
              node.scrollIntoView = scrollIntoView
            }
          }}
        >
          Target
        </section>
        <ArticleAnchorNavigation returnLabel="Return to reading position" />
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Jump' }))

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
    })
  })
})
