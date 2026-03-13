import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await page.waitForURL('http://localhost:3000/zh-CN')
    await expect(page).toHaveTitle(/ZBlog/)

    const heading = page.locator('h1').first()
    const seededPost = page.getByRole('link', { name: '带引用与版本历史的示例文章（修订）' })

    await expect(heading).toHaveText(/multilingual, citation-aware blog/i)
    await expect(seededPost).toBeVisible()
  })

  test('can render a seeded article with references and history link', async ({ page }) => {
    await page.goto('http://localhost:3000/zh-CN/posts/seed-citation-demo')

    await expect(page.locator('h1').first()).toHaveText('带引用与版本历史的示例文章（修订）')
    await expect(page.getByRole('link', { name: 'Version history' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'References' })).toBeVisible()
    await expect(page.getByText('Designing Blogs that Respect References')).toBeVisible()
  })

  test('can view seeded version history', async ({ page }) => {
    await page.goto('http://localhost:3000/zh-CN/posts/seed-citation-demo/history')

    await expect(page.locator('h1').first()).toHaveText('Version history')
    await expect(page.getByText(/Version ID/).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Content' }).first()).toBeVisible()
  })
})
