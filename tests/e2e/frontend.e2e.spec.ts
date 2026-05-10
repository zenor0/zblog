import { test, expect, Page } from '@playwright/test'

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
})
