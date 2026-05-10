import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

function setViewportSize(args: { height: number; width: number }) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: args.height,
  })
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: args.width,
  })
}

function setElementRect(element: HTMLElement, rect: Partial<DOMRect>) {
  element.getBoundingClientRect = vi.fn(() => ({
    bottom: rect.bottom ?? (rect.top ?? 0) + (rect.height ?? 0),
    height: rect.height ?? 0,
    left: rect.left ?? 0,
    right: rect.right ?? (rect.left ?? 0) + (rect.width ?? 0),
    toJSON: () => ({}),
    top: rect.top ?? 0,
    width: rect.width ?? 0,
    x: rect.x ?? rect.left ?? 0,
    y: rect.y ?? rect.top ?? 0,
  }))
}

describe('ArticleAnchorNavigation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('smoothly jumps to article anchors with an upper-middle offset and exposes a target-adjacent return button', async () => {
    setReducedMotion(false)
    setViewportSize({ height: 800, width: 1200 })
    setScrollY(420)

    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const pushState = vi.spyOn(window.history, 'pushState')

    render(
      <>
        <a href="#target-section">Jump</a>
        <section
          id="target-section"
          ref={(node) => {
            if (node) {
              setElementRect(node, {
                height: 64,
                left: 300,
                top: 500,
                width: 620,
              })
            }
          }}
        >
          Target
        </section>
        <ArticleAnchorNavigation returnLabel="Return to reading position" />
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Jump' }))

    expect(scrollTo).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 696,
    })
    expect(pushState).toHaveBeenCalledWith(null, '', '#target-section')

    const target = screen.getByText('Target')

    expect(target.getAttribute('data-article-anchor-highlight')).toBe('true')

    const returnButton = screen.getByRole('button', { name: 'Return to reading position' })

    await waitFor(() => {
      expect(returnButton.style.left).toBe('932px')
      expect(returnButton.style.top).toBe('500px')
    })

    fireEvent.click(returnButton)

    expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: 'smooth',
      top: 420,
    })
  })

  it('disables smooth scrolling when the user prefers reduced motion', () => {
    setReducedMotion(true)
    setViewportSize({ height: 600, width: 1000 })
    setScrollY(120)

    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    render(
      <>
        <a href="#target-section">Jump</a>
        <section
          id="target-section"
          ref={(node) => {
            if (node) {
              setElementRect(node, {
                height: 40,
                left: 240,
                top: 300,
                width: 540,
              })
            }
          }}
        >
          Target
        </section>
        <ArticleAnchorNavigation returnLabel="Return to reading position" />
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Jump' }))

    expect(scrollTo).toHaveBeenCalledWith({
      behavior: 'auto',
      top: 252,
    })
  })
})
