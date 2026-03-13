import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  const emailField = page.getByLabel(/^Email/)
  const passwordField = page.getByLabel(/^Password/)

  await emailField.fill(user.email)
  await passwordField.fill(user.password)
  await page.getByRole('button', { name: 'Login' }).click()

  await page.waitForURL(new RegExp(`^${serverURL}/admin/?(?:\\?.*)?$`))

  const dashboardArtifact = page.locator('span[title="Dashboard"]')
  await expect(dashboardArtifact).toBeVisible()
}
