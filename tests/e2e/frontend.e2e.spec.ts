import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveURL(/http:\/\/localhost:3000\/(en|zh-hans)$/)
    await expect(page).toHaveTitle(/ZBlog/)

    const heading = page.locator('h1').first()
    const seededPost = page.getByRole('link', { name: 'Seed Post with Citations and Version History' })

    await expect(heading).toBeVisible()
    await expect(page.getByRole('link', { name: '简体中文' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'English' })).toBeVisible()
    await expect(seededPost).toBeVisible()
  })

  test('can render a seeded article with references and history link', async ({ page }) => {
    await page.goto('http://localhost:3000/zh-hans/posts/seed-citation-demo')

    await expect(page.locator('h1').first()).toHaveText('带引用与版本历史的示例文章（修订）')
    await expect(page.getByRole('link', { name: '版本历史' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '目录' })).toBeVisible()
    await expect(page.locator('summary')).toContainText('参考文献')
    await expect(page.getByText('Designing Blogs that Respect References')).toBeHidden()

    await page.locator('summary').click()

    await expect(page.getByText('Designing Blogs that Respect References')).toBeVisible()
  })

  test('can view seeded version history', async ({ page }) => {
    await page.goto('http://localhost:3000/zh-hans/posts/seed-citation-demo/history')

    await expect(page.locator('h1').first()).toHaveText('版本历史')
    await expect(page.getByText(/版本 ID/).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Content' }).first()).toBeVisible()
  })
})
