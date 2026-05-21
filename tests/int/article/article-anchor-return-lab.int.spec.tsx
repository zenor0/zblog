import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ArticleAnchorReturnLabNavigation,
  ArticleAnchorReturnLabShell,
} from '@/app/(frontend)/dev/article-anchor-return/ArticleAnchorReturnLab'
import {
  articleAnchorReturnVariants,
  defaultArticleAnchorReturnVariantID,
} from '@/app/(frontend)/dev/article-anchor-return/articleAnchorReturnLabModel'

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

function renderLab() {
  return render(
    <ArticleAnchorReturnLabShell>
      <a href="#target-section">Jump to target</a>
      <section
        id="target-section"
        ref={(node) => {
          if (node) {
            setElementRect(node, {
              height: 80,
              left: 260,
              top: 420,
              width: 540,
            })
          }
        }}
      >
        Target
      </section>
      <ArticleAnchorReturnLabNavigation returnLabel="Return to reading position" />
    </ArticleAnchorReturnLabShell>,
  )
}

describe('ArticleAnchorReturnLab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setReducedMotion(true)
    setViewportSize({ height: 700, width: 390 })
    setScrollY(180)
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    vi.spyOn(window.history, 'pushState').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('defines the expected variant set with the compact fade pill as the default', () => {
    expect(defaultArticleAnchorReturnVariantID).toBe('fade-pill')
    expect(articleAnchorReturnVariants.map((variant) => variant.id)).toEqual([
      'baseline',
      'fade-pill',
      'edge-tab',
      'auto-toast',
    ])
  })

  it('switches variants and collapses the fade pill after the delay', async () => {
    renderLab()

    const controls = screen.getByRole('group', { name: '返回控件方案' })

    expect(controls).toBeTruthy()
    expect(screen.getByRole('button', { name: '渐隐胶囊' }).getAttribute('aria-pressed')).toBe(
      'true',
    )

    fireEvent.click(screen.getByRole('link', { name: 'Jump to target' }))

    const returnButton = screen.getByRole('button', { name: 'Return to reading position' })

    expect(returnButton.getAttribute('data-anchor-return-variant')).toBe('fade-pill')
    expect(returnButton.getAttribute('data-anchor-return-collapsed')).toBe('false')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3300)
    })

    expect(returnButton.getAttribute('data-anchor-return-collapsed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: '靠边标签' }))
    fireEvent.click(screen.getByRole('link', { name: 'Jump to target' }))

    expect(
      screen
        .getByRole('button', { name: 'Return to reading position' })
        .getAttribute('data-anchor-return-variant'),
    ).toBe('edge-tab')
  })

  it('dismisses only the current jump and shows again after another in-page jump', () => {
    renderLab()

    fireEvent.click(screen.getByRole('link', { name: 'Jump to target' }))

    expect(screen.getByRole('button', { name: 'Return to reading position' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '隐藏返回提示' }))

    expect(screen.queryByRole('button', { name: 'Return to reading position' })).toBeNull()

    fireEvent.click(screen.getByRole('link', { name: 'Jump to target' }))

    expect(screen.getByRole('button', { name: 'Return to reading position' })).toBeTruthy()
  })

  it('auto-hides the toast variant after its timeout', async () => {
    renderLab()

    fireEvent.click(screen.getByRole('button', { name: '自动提示' }))
    fireEvent.click(screen.getByRole('link', { name: 'Jump to target' }))

    expect(
      screen
        .getByRole('button', { name: 'Return to reading position' })
        .getAttribute('data-anchor-return-variant'),
    ).toBe('auto-toast')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4300)
    })

    expect(screen.queryByRole('button', { name: 'Return to reading position' })).toBeNull()
  })
})
