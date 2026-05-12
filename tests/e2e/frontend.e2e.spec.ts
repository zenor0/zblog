import { test, expect, Page } from '@playwright/test'

type ContrastTarget = {
  label: string
  selector: string
}

async function readContrastReports(page: Page, targets: ContrastTarget[]) {
  return page.evaluate((contrastTargets) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Unable to create canvas context for color normalization')
    }

    const colorContext = context

    function parseChannels(channels: string[]) {
      const [r, g, b] = channels.slice(0, 3).map((value) => Number.parseFloat(value))

      if (
        typeof r !== 'number' ||
        typeof g !== 'number' ||
        typeof b !== 'number' ||
        Number.isNaN(r) ||
        Number.isNaN(g) ||
        Number.isNaN(b)
      ) {
        throw new Error(`Unable to parse color channels: ${channels.join(' ')}`)
      }

      return { b, g, r }
    }

    function parseOKLCH(color: string) {
      const match = color.match(
        /^oklch\(\s*([^\s]+)\s+([^\s]+)\s+([^\s/)]+)(?:\s*\/\s*[^\s)]+)?\s*\)$/i,
      )

      if (!match?.[1] || !match[2] || !match[3]) {
        return null
      }

      const lightness = match[1].endsWith('%')
        ? Number.parseFloat(match[1]) / 100
        : Number.parseFloat(match[1])
      const chroma = Number.parseFloat(match[2])
      const hue = Number.parseFloat(match[3])

      if (Number.isNaN(lightness) || Number.isNaN(chroma) || Number.isNaN(hue)) {
        return null
      }

      const hueRadians = (hue * Math.PI) / 180
      const a = chroma * Math.cos(hueRadians)
      const b = chroma * Math.sin(hueRadians)
      const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
      const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
      const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b
      const l = lPrime * lPrime * lPrime
      const m = mPrime * mPrime * mPrime
      const s = sPrime * sPrime * sPrime

      function toSRGB(value: number) {
        const gamma = value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055

        return Math.min(255, Math.max(0, gamma * 255))
      }

      return {
        b: toSRGB(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
        g: toSRGB(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        r: toSRGB(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      }
    }

    function normalizeColor(color: string): { b: number; g: number; r: number } {
      const oklch = parseOKLCH(color)

      if (oklch) {
        return oklch
      }

      colorContext.fillStyle = '#000000'
      colorContext.fillStyle = color

      const normalized = colorContext.fillStyle
      const hex = normalized.match(/^#([0-9a-f]{6})$/i)

      if (hex?.[1]) {
        return {
          b: Number.parseInt(hex[1].slice(4, 6), 16),
          g: Number.parseInt(hex[1].slice(2, 4), 16),
          r: Number.parseInt(hex[1].slice(0, 2), 16),
        }
      }

      const rgb = normalized.match(/^rgba?\(([^)]+)\)$/i)

      if (rgb?.[1]) {
        return parseChannels(rgb[1].split(/[,\s/]+/).filter(Boolean))
      }

      const srgb = normalized.match(/^color\(srgb\s+([^)]+)\)$/i)

      if (srgb?.[1]) {
        const channels = srgb[1]
          .split(/[,\s/]+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((value) => String(Number.parseFloat(value) * 255))

        return parseChannels(channels)
      }

      throw new Error(`Unsupported normalized color: ${color} -> ${normalized}`)
    }

    function isTransparent(color: string) {
      return (
        color === 'transparent' ||
        color === 'rgba(0, 0, 0, 0)' ||
        /\/\s*0\)?$/.test(color) ||
        /,\s*0\)$/.test(color)
      )
    }

    function readEffectiveBackground(element: Element) {
      let current: Element | null = element

      while (current) {
        const background = getComputedStyle(current).backgroundColor

        if (!isTransparent(background)) {
          return background
        }

        current = current.parentElement
      }

      return getComputedStyle(document.documentElement).backgroundColor
    }

    function luminance(channel: number) {
      const normalized = channel / 255

      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4)
    }

    function contrastRatio(
      foreground: ReturnType<typeof normalizeColor>,
      background: ReturnType<typeof normalizeColor>,
    ) {
      const foregroundLuminance =
        0.2126 * luminance(foreground.r) +
        0.7152 * luminance(foreground.g) +
        0.0722 * luminance(foreground.b)
      const backgroundLuminance =
        0.2126 * luminance(background.r) +
        0.7152 * luminance(background.g) +
        0.0722 * luminance(background.b)
      const lighter = Math.max(foregroundLuminance, backgroundLuminance)
      const darker = Math.min(foregroundLuminance, backgroundLuminance)

      return (lighter + 0.05) / (darker + 0.05)
    }

    return contrastTargets.map((target) => {
      const element = document.querySelector(target.selector)

      if (!element) {
        throw new Error(`Missing contrast target: ${target.selector}`)
      }

      const foreground = getComputedStyle(element).color
      const background = readEffectiveBackground(element)

      return {
        background,
        foreground,
        label: target.label,
        ratio: contrastRatio(normalizeColor(foreground), normalizeColor(background)),
        selector: target.selector,
      }
    })
  }, targets)
}

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/(en|zh-hans)$/)
    await expect(page).toHaveTitle(/ZBlog/)
    await expect(page.locator('[data-editorial-shell="true"]')).toBeVisible()
    await expect(page.locator('[data-home-hero]')).toBeVisible()
    await expect(page.locator('[data-home-featured-post]')).toBeVisible()
    await expect(page.locator('[data-home-post-list]')).toBeVisible()
    await expect(page.locator('[data-home-post-list] article').first()).toBeVisible()

    const heading = page.locator('h1').first()
    const seededPost = page.getByRole('link', {
      name: 'Seed Post with Citations and Version History',
    })
    const showcasePost = page.getByRole('link', { name: 'Markdown Feature Showcase' })

    await expect(heading).toBeVisible()
    await expect(seededPost).toBeVisible()
    await expect(showcasePost).toBeVisible()

    await page.getByRole('button', { name: /语言|Locales/ }).click()
    await expect(page.getByRole('menuitem', { name: '简体中文' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'English' })).toBeVisible()
  })

  test('can render a seeded article with references and history link', async ({ page }) => {
    await page.goto('/zh-hans/posts/seed-citation-demo')

    await expect(page.locator('h1').first()).toHaveText('带引用与版本历史的示例文章（修订）')
    await expect(page.locator('[data-article-frontmatter]')).toBeVisible()
    await expect(page.locator('[data-article-reading-column]')).toBeVisible()
    await expect(page.locator('[data-article-supplementary]')).toBeVisible()
    await expect(page.locator('[data-toc-rail]')).toBeVisible()
    await expect(page.locator('[data-post-reading-root]')).toBeVisible()
    await expect(page.getByRole('link', { name: '版本历史' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '目录' })).toBeVisible()
    await expect(page.locator('summary')).toContainText('参考文献')
    await expect(page.getByText('Designing Blogs that Respect References')).toBeHidden()

    await page.locator('summary').click()

    await expect(page.getByText('Designing Blogs that Respect References')).toBeVisible()
  })

  test('keeps configured article width aligned across frontmatter, hero, and body', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1100 })
    await page.goto('/dev/article-layout')

    const metrics = await page.evaluate(() => {
      const getRect = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector)

        if (!element) {
          throw new Error(`Missing element for selector: ${selector}`)
        }

        const rect = element.getBoundingClientRect()

        return {
          left: rect.left,
          width: rect.width,
        }
      }

      return {
        body: getRect('[data-post-reading-root]'),
        frontmatter: getRect('[data-article-frontmatter]'),
        hero: getRect('[data-article-reading-column] > figure'),
        pageFrame: getRect('.page-frame'),
        readingColumn: getRect('[data-article-reading-column]'),
      }
    })

    expect(metrics.readingColumn.width).toBeLessThan(metrics.pageFrame.width - 120)

    for (const region of [metrics.frontmatter, metrics.hero, metrics.body]) {
      expect(Math.abs(region.left - metrics.readingColumn.left)).toBeLessThanOrEqual(1)
      expect(Math.abs(region.width - metrics.readingColumn.width)).toBeLessThanOrEqual(1)
    }
  })

  test('can view seeded version history', async ({ page }) => {
    await page.goto('/zh-hans/posts/seed-citation-demo/history')

    await expect(page.locator('h1').first()).toHaveText('版本历史')
    await expect(page.getByText(/版本 ID/).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Content' }).first()).toBeVisible()
  })

  test('can render the seeded markdown showcase article', async ({ page }) => {
    await page.goto('/zh-hans/posts/seed-markdown-showcase')

    await expect(page.locator('h1').first()).toHaveText('Markdown 能力展示文章')
    await expect(page.locator('figure#ref-fig-seed-hero')).toBeVisible()
    await expect(page.locator('figure#ref-tbl-feature-matrix')).toBeVisible()
    await expect(page.locator('a[href="#ref-fig-seed-hero"]')).toContainText('图 1')
    await expect(page.locator('a[href="#ref-tbl-feature-matrix"]')).toContainText('表 1')
    await expect(page.locator('[data-markdown-component="notice-card"]')).toBeVisible()
    await expect(page.locator('[data-markdown-component="feature-grid"]')).toBeVisible()
    await expect(
      page.locator('[data-post-reading-root] h2[data-article-heading-number="1"]').first(),
    ).toBeVisible()
    await expect(page.locator('pre[data-language="tsx"]')).toBeVisible()
    await expect(page.locator('summary')).toContainText('参考文献')
  })

  test('keeps semantic article blocks readable in dark mode', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('zblog-frontend-theme', 'dark')
    })

    await page.goto('/dev/design-system/article-blocks/callouts')
    await page.evaluate(() => {
      document.documentElement.dataset.zblogTheme = 'dark'
      document.documentElement.classList.add('dark')
    })
    await expect(page.locator('.md-callout').first()).toBeVisible()

    const calloutReports = await readContrastReports(page, [
      { label: 'note callout', selector: '#callout-note .md-callout' },
      { label: 'tip callout', selector: '#callout-tip .md-callout' },
      { label: 'important callout', selector: '#callout-important .md-callout' },
      { label: 'warning callout', selector: '#callout-warning .md-callout' },
      { label: 'caution callout', selector: '#callout-caution .md-callout' },
      { label: 'custom callout', selector: '#callout-custom .md-callout' },
    ])

    await page.goto('/dev/design-system/article-blocks/components')
    await page.evaluate(() => {
      document.documentElement.dataset.zblogTheme = 'dark'
      document.documentElement.classList.add('dark')
    })
    await expect(page.locator('[data-markdown-component="notice-card"]')).toBeVisible()

    const componentReports = await readContrastReports(page, [
      { label: 'notice card', selector: '#notice-card [data-markdown-component="notice-card"]' },
      {
        label: 'feature grid card',
        selector: '#feature-grid [data-markdown-component="feature-grid"] [data-slot="card"]',
      },
    ])

    for (const report of [...calloutReports, ...componentReports]) {
      expect(
        report.ratio,
        `${report.label} contrast was ${report.ratio.toFixed(2)} for ${report.foreground} on ${report.background}`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('shows article link previews and a return control for in-page jumps', async ({ page }) => {
    await page.goto('/zh-hans/posts/seed-markdown-showcase')

    const tocLink = page.locator('[data-toc-rail] a', { hasText: '图表与交叉引用' }).first()

    await tocLink.hover()
    await expect(page.locator('[data-slot="hover-card-content"]')).toHaveCount(0)

    const bibliographyLink = page.locator('[data-post-reading-root] a[href="#reference-1"]').first()

    await bibliographyLink.hover()
    await expect(page.locator('[data-link-preview-card-kind="bibliography"]')).toContainText(
      'Designing Blogs that Respect References',
    )

    const figureLink = page.locator('[data-post-reading-root] a[href="#ref-fig-seed-hero"]').first()

    await figureLink.hover()
    await expect(page.locator('[data-link-preview-card-kind="articleElement"]')).toContainText(
      '图 1',
    )

    const externalLink = page.getByRole('link', { name: 'Payload CMS 文档' })

    await externalLink.hover()
    await expect(page.locator('[data-link-preview-card-kind="external"]')).toContainText(
      'payloadcms.com',
    )

    await figureLink.click()

    const returnButton = page.getByRole('button', { name: '回到原阅读位置' })

    await expect(returnButton).toBeVisible()
    await expect
      .poll(async () => {
        return page.locator('#ref-fig-seed-hero').evaluate((element) => {
          const top = element.getBoundingClientRect().top

          return top > window.innerHeight * 0.2 && top < window.innerHeight * 0.36
        })
      })
      .toBe(true)

    const returnButtonDistance = await returnButton.evaluate((button) => {
      const buttonRect = button.getBoundingClientRect()
      const targetRect = document.getElementById('ref-fig-seed-hero')?.getBoundingClientRect()

      return targetRect ? Math.abs(buttonRect.top - targetRect.top) : Number.POSITIVE_INFINITY
    })
    const returnButtonIsLeftOfTarget = await returnButton.evaluate((button) => {
      const buttonRect = button.getBoundingClientRect()
      const targetRect = document.getElementById('ref-fig-seed-hero')?.getBoundingClientRect()

      return targetRect ? buttonRect.left < targetRect.left : false
    })

    expect(returnButtonDistance).toBeLessThan(80)
    expect(returnButtonIsLeftOfTarget).toBe(true)
    await returnButton.click()
    await expect(returnButton).toBeHidden()
  })

  test('can compare compact anchor return controls in the dev lab', async ({ page }) => {
    await page.setViewportSize({ height: 800, width: 390 })
    await page.goto('/dev/article-anchor-return', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: '锚点返回控件实验' })).toBeVisible()
    await page.getByRole('button', { name: '靠边标签' }).click()

    await page
      .locator('[data-post-reading-root] a[href="#ref-fig-return-control-target"]')
      .first()
      .click()

    const returnControl = page.locator('[data-anchor-return-variant="edge-tab"]')

    await expect(returnControl).toBeVisible()

    const fitsViewport = await returnControl.evaluate((element) => {
      const rect = element.getBoundingClientRect()

      return rect.left >= 0 && rect.right <= window.innerWidth
    })

    expect(fitsViewport).toBe(true)

    await page.getByRole('button', { name: '隐藏返回提示' }).click()
    await expect(returnControl).toHaveCount(0)

    await page
      .locator('[data-post-reading-root] a[href="#ref-fig-return-control-target"]')
      .first()
      .click()

    await expect(page.locator('[data-anchor-return-variant="edge-tab"]')).toBeVisible()
  })

  test('shows the mobile article progress right rail prototype without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 844, width: 390 })
    await page.goto('/dev/article-progress')

    const rightRail = page.locator('[data-mobile-toc-variant="right-rail"]')

    await expect(rightRail).toBeVisible()
    expect(await page.locator('[data-mobile-toc-preview]').count()).toBe(0)

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })

    expect(hasHorizontalOverflow).toBe(false)

    const box = await rightRail.boundingBox()

    if (!box) {
      throw new Error('Missing right rail bounding box')
    }

    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.18)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.82)
    await expect(page.locator('[data-mobile-toc-preview]')).toBeVisible()
    await page.mouse.up()

    await expect.poll(() => page.evaluate(() => window.location.hash.length > 1)).toBe(true)
  })
})
