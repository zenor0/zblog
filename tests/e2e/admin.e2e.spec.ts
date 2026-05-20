import { test, expect, Page, BrowserContext } from '@playwright/test'
import { createMDshipWorkspaceFiles } from '../helpers/createMDshipWorkspace'
import { createPostPackageFiles } from '../helpers/createPostPackage'
import { getTestPayload } from '../helpers/getTestPayload'
import { login } from '../helpers/login'
import { retryOnSqliteBusy } from '../helpers/retryOnSqliteBusy'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

const serverURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

async function cleanupDraftPreviewPost() {
  const payload = await getTestPayload()

  await retryOnSqliteBusy(async () => {
    await payload.delete({
      collection: 'posts',
      where: {
        slug: {
          equals: 'preview-draft-demo',
        },
      },
    })
  })
}

async function cleanupPostByID(id: number) {
  const payload = await getTestPayload()

  await retryOnSqliteBusy(async () => {
    await payload.delete({
      collection: 'posts',
      id,
    })
  })
}

async function seedDraftPreviewPost() {
  const payload = await getTestPayload()

  await cleanupDraftPreviewPost()

  const post = await payload.create({
    collection: 'posts',
    data: {
      content: '# 预览草稿示例文章\n\n这一段只应该在 preview 中可见。',
      excerpt: '只用于验证 preview 链路。',
      slug: 'preview-draft-demo',
      title: '预览草稿示例文章',
    },
    draft: true,
  })

  return {
    id: post.id,
    slug: 'preview-draft-demo',
  }
}

async function seedUntitledDraftPreviewPost() {
  const payload = await getTestPayload()

  const post = await payload.create({
    collection: 'posts',
    data: {
      content: '这是一篇没有标题和 slug 的草稿，但仍然应该可以预览。',
      excerpt: '用于验证无 slug 草稿预览链路。',
    },
    draft: true,
  })

  return {
    id: post.id,
  }
}

async function seedAdminLayoutPost() {
  const payload = await getTestPayload()

  await retryOnSqliteBusy(async () => {
    await payload.delete({
      collection: 'posts',
      where: {
        slug: {
          equals: 'admin-layout-demo',
        },
      },
    })
  })

  return payload.create({
    collection: 'posts',
    data: {
      content: '# Admin layout demo\n\nBody copy for admin layout assertions.',
      excerpt: 'Post used to verify the admin information architecture.',
      slug: 'admin-layout-demo',
      title: 'Admin Layout Demo',
    },
    draft: true,
  })
}

async function submitImport(page: Page) {
  const response = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === 'POST' && candidate.url().includes('/api/post-package-import'),
      {
        timeout: 30_000,
      },
    ),
    page.getByTestId('import-submit').click({ force: true }),
  ])

  expect(response[0]?.ok()).toBeTruthy()
}

async function waitForImportPanelReady(page: Page) {
  await expect(page.getByTestId('import-panel')).toHaveAttribute('data-state', 'ready', {
    timeout: 15_000,
  })
}

async function openImportMenu(page: Page) {
  const trigger = page.getByTestId('post-import-trigger')

  await expect(trigger).toBeEnabled()
  await trigger.click()
  await waitForImportPanelReady(page)
  await expect(page.getByTestId('import-panel')).toBeVisible()
}

async function activateImportMode(page: Page, mode: 'mdship' | 'zip') {
  const testID = mode === 'zip' ? 'import-mode-zip' : 'import-mode-mdship'

  await page.getByTestId(testID).evaluate((element) => {
    ;(element as HTMLButtonElement).click()
  })
}

async function waitForPostDocumentReady(page: Page) {
  await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText('Publishing snapshot')).toBeVisible({
    timeout: 30_000,
  })
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
}

test.describe('Admin Panel', () => {
  let context: BrowserContext
  let page: Page

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000)

    await seedTestUser()

    context = await browser.newContext()
    page = await context.newPage()

    await login({ page, serverURL, user: testUser })
  })

  test.afterAll(async () => {
    await context?.close()
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto(`${serverURL}/admin`)
    await expect(page).toHaveURL(`${serverURL}/admin`)
  })

  test('can navigate to list view', async () => {
    await page.goto(`${serverURL}/admin/collections/users`)
    await expect(page).toHaveURL(
      new RegExp(`^${serverURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/admin/collections/users(?:\\?depth=1&limit=10)?$`),
    )
  })

  test('can navigate to edit view', async () => {
    await page.goto(`${serverURL}/admin/collections/users/create`)
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('can open the posts collection and create view with overview first', async () => {
    await page.goto(`${serverURL}/admin/collections/posts`)
    await expect(page).toHaveURL(
      new RegExp(`^${serverURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/admin/collections/posts(?:\\?depth=1&limit=10)?$`),
    )

    await page.goto(`${serverURL}/admin/collections/posts/create`)
    await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)
    await expect(page.getByTestId('post-import-trigger')).toBeVisible()
    await waitForPostDocumentReady(page)

    await page.getByRole('button', { name: 'Core Content' }).click({ force: true })
    await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('textbox', { name: 'Slug *' })).toBeVisible()
  })

  test('can open the import menu from the create flow', async () => {
    await page.goto(`${serverURL}/admin/collections/posts/create`)
    await expect(page.getByTestId('post-import-trigger')).toBeVisible()
    await openImportMenu(page)
    await expect(page.getByTestId('import-panel')).toBeVisible()
  })

  test('can preview a draft post through the frontend preview route', async () => {
    const draftPost = await seedDraftPreviewPost()

    try {
      await page.goto(`${serverURL}/admin/collections/posts/${draftPost.id}`)
      await expect(page.locator('main').first()).toBeVisible()

      await page.goto(`${serverURL}/api/preview?collection=posts&id=${draftPost.id}&locale=zh-CN`)

      await expect(page).toHaveURL(`${serverURL}/zh-hans/posts/${draftPost.slug}`)
      await expect(page.getByRole('alert').getByText('预览模式')).toBeVisible()
      await expect(page.locator('h1').first()).toHaveText('预览草稿示例文章')
      await expect(page.getByText('这一段只应该在 preview 中可见。')).toBeVisible()
      await expect(page.getByRole('link', { name: '退出预览' })).toBeVisible()
    } finally {
      await cleanupDraftPreviewPost()
    }
  })

  test('can preview an untitled draft without a slug', async () => {
    const draftPost = await seedUntitledDraftPreviewPost()

    try {
      await page.goto(`${serverURL}/api/preview?collection=posts&id=${draftPost.id}&locale=zh-CN`)

      await expect(page).toHaveURL(`${serverURL}/zh-hans/preview/posts/${draftPost.id}`)
      await expect(page.locator('h1').first()).toHaveText('未命名草稿')
      await expect(page.getByText('这是一篇没有标题和 slug 的草稿')).toBeVisible()
      await expect(page.getByRole('link', { name: '退出预览' })).toBeVisible()
    } finally {
      await cleanupPostByID(draftPost.id)
    }
  })

  test('post edit view uses overview-first top-level workflow tabs', async () => {
    const post = await seedAdminLayoutPost()

    try {
      await page.goto(`${serverURL}/admin/collections/posts/${post.id}`)
      await waitForPostDocumentReady(page)

      const documentPane = page.locator('main')
      const overviewTab = documentPane.getByRole('button', { name: 'Overview' })
      const coreTab = documentPane.getByRole('button', { name: 'Core Content' })
      const assetsTab = documentPane.getByRole('button', { name: 'Assets & References' })
      const translationTab = documentPane.getByRole('button', { name: 'Translation' })
      const seoTab = documentPane.getByRole('button', { name: 'SEO' })

      await expect(overviewTab).toBeVisible()
      await expect(coreTab).toBeVisible()
      await expect(assetsTab).toBeVisible()
      await expect(translationTab).toBeVisible()
      await expect(seoTab).toBeVisible()

      await coreTab.click({ force: true })
      await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByText('Owned media')).toBeVisible()

      await translationTab.click({ force: true })
      await expect(page.getByText('Translation management')).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByRole('button', { name: 'Translate from...' }).first()).toBeVisible()
    } finally {
      await cleanupPostByID(post.id)
    }
  })

  test('can import and update a post package from the import dropdown', async () => {
    const packageFiles = await createPostPackageFiles()
    const initialPackage = await packageFiles.createVariant('imported-package-v1.zip', {
      enTitle: 'Imported Package Demo',
      slug: 'imported-package-demo',
      zhTitle: '导入包示例文章',
    })
    const updatedPackage = await packageFiles.createVariant('imported-package-v2.zip', {
      bodyAppendix: '第二次导入追加了这一段，用于验证整包更新会生成新的版本记录。',
      enTitle: 'Imported Package Demo Revised',
      slug: 'imported-package-demo',
      zhTitle: '导入包示例文章（更新）',
    })

    try {
      await page.goto(`${serverURL}/admin/collections/posts/create`)
      await openImportMenu(page)

      await activateImportMode(page, 'zip')
      await expect(page.getByTestId('import-source-hint')).toContainText(/ZIP/i)
      await page.setInputFiles('[data-testid="import-zip-input"]', initialPackage)
      await submitImport(page)
      await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)

      await expect(page.getByTestId('post-import-trigger')).toBeVisible()
      await openImportMenu(page)
      await activateImportMode(page, 'zip')
      await page.setInputFiles('[data-testid="import-zip-input"]', updatedPackage)
      await submitImport(page)
      await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)

      await page.goto(`${serverURL}/zh-hans/posts/imported-package-demo`)
      await expect(page.locator('h1').first()).toHaveText('导入包示例文章（更新）')
      await expect(page.locator('summary')).toContainText('参考文献')
      await page.locator('summary').click()
      await expect(page.getByText('Composable Publishing Workflows')).toBeVisible()
      await expect(page.getByText('第二次导入追加了这一段')).toBeVisible()

      await page.goto(`${serverURL}/zh-hans/posts/imported-package-demo/history`)
      await expect(page.locator('h1').first()).toHaveText('版本历史')
      await expect(page.getByText(/版本 ID/).first()).toBeVisible()
    } finally {
      await packageFiles.cleanup()
    }
  })

  test('can import and update an mdship workspace folder from the import dropdown', async () => {
    const workspaceFiles = await createMDshipWorkspaceFiles()
    const initialWorkspace = await workspaceFiles.createVariant('mdship-workspace-v1', {
      title: 'MDship 导入示例文章',
    })
    const updatedWorkspace = await workspaceFiles.createVariant('mdship-workspace-v2', {
      bodyAppendix: '这段文字来自第二次 mdship 工作区导入，用于验证更新版本。',
      title: 'MDship 导入示例文章（更新）',
    })

    try {
      await page.goto(`${serverURL}/admin/collections/posts/create`)
      await openImportMenu(page)

      await activateImportMode(page, 'mdship')
      await page.getByTestId('import-slug-override').fill('mdship-import-demo')
      await page.getByTestId('import-locale-override').selectOption('zh-Hans')
      await expect(page.getByTestId('import-source-hint')).toContainText(/MDship/i)

      await page.setInputFiles('[data-testid="import-workspace-input"]', initialWorkspace)
      await submitImport(page)
      await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)

      await expect(page.getByTestId('post-import-trigger')).toBeVisible()
      await openImportMenu(page)
      await activateImportMode(page, 'mdship')
      await page.getByTestId('import-slug-override').fill('mdship-import-demo')
      await page.getByTestId('import-locale-override').selectOption('zh-Hans')
      await page.setInputFiles('[data-testid="import-workspace-input"]', updatedWorkspace)
      await submitImport(page)
      await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)

      await page.goto(`${serverURL}/zh-hans/posts/mdship-import-demo`)
      await expect(page.locator('h1').first()).toHaveText('MDship 导入示例文章（更新）')
      await expect(page.locator('summary')).toContainText('参考文献')
      await page.locator('summary').click()
      await expect(page.getByText('Composable Publishing Workflows')).toBeVisible()
      await expect(page.getByText('这段文字来自第二次 mdship 工作区导入')).toBeVisible()
    } finally {
      await workspaceFiles.cleanup()
    }
  })
})
