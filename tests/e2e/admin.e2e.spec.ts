import { test, expect, Page } from '@playwright/test'
import config from '../../src/payload.config.js'
import { getPayload } from 'payload'
import { createMDshipWorkspaceFiles } from '../helpers/createMDshipWorkspace'
import { createPostPackageFiles } from '../helpers/createPostPackage'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

async function cleanupDraftPreviewPost() {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'posts',
    where: {
      slug: {
        equals: 'preview-draft-demo',
      },
    },
  })
}

async function cleanupPostByID(id: number) {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'posts',
    id,
  })
}

async function seedDraftPreviewPost() {
  const payload = await getPayload({ config })

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
  const payload = await getPayload({ config })

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
  await page.getByTestId('post-import-trigger').click()
  await waitForImportPanelReady(page)
}

async function activateImportMode(page: Page, mode: 'mdship' | 'zip') {
  const testID = mode === 'zip' ? 'import-mode-zip' : 'import-mode-mdship'

  await page.getByTestId(testID).evaluate((element) => {
    ;(element as HTMLButtonElement).click()
  })
}

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000)

    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('can open the posts collection and create view', async () => {
    await page.goto('http://localhost:3000/admin/collections/posts')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/posts')
    await expect(page.locator('h1', { hasText: 'Posts' }).first()).toBeVisible()

    await page.goto('http://localhost:3000/admin/collections/posts/create')
    await expect(page.locator('input[name=\"slug\"]')).toBeVisible()
    await expect(page.locator('input[name=\"title\"]')).toBeVisible()
    await expect(page.getByTestId('post-import-trigger')).toBeVisible()
  })

  test('can open the import menu from the create flow', async () => {
    await page.goto('http://localhost:3000/admin/collections/posts/create')
    await expect(page.getByTestId('post-import-trigger')).toBeVisible()
    await openImportMenu(page)
    await expect(page.getByText('Import packaged content')).toBeVisible()
  })

  test('can open the translate menu from the document controls', async () => {
    await page.goto('http://localhost:3000/admin/collections/posts/create')
    await expect(page.getByTestId('translate-locale-trigger')).toBeVisible()
    await page.getByTestId('translate-locale-trigger').click()
    await expect(page.getByTestId('translate-locale-menu')).toBeVisible()
    await expect(page.getByText('Machine translation')).toBeVisible()
  })

  test('can preview a draft post through the frontend preview route', async () => {
    const draftPost = await seedDraftPreviewPost()

    try {
      await page.goto(`http://localhost:3000/admin/collections/posts/${draftPost.id}`)
      await expect(page.getByText('Preview')).toBeVisible()

      await page.goto(
        `http://localhost:3000/api/preview?collection=posts&id=${draftPost.id}&locale=zh-CN`,
      )

      await expect(page).toHaveURL(`http://localhost:3000/zh-hans/posts/${draftPost.slug}`)
      await expect(page.getByText('预览模式')).toBeVisible()
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
      await page.goto(
        `http://localhost:3000/api/preview?collection=posts&id=${draftPost.id}&locale=zh-CN`,
      )

      await expect(page).toHaveURL(`http://localhost:3000/zh-hans/preview/posts/${draftPost.id}`)
      await expect(page.locator('h1').first()).toHaveText('未命名草稿')
      await expect(page.getByText('这是一篇没有标题和 slug 的草稿')).toBeVisible()
      await expect(page.getByRole('link', { name: '退出预览' })).toBeVisible()
    } finally {
      await cleanupPostByID(draftPost.id)
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
      await page.goto('http://localhost:3000/admin/collections/posts/create')
      await openImportMenu(page)

      await activateImportMode(page, 'zip')
      await expect(page.getByTestId('import-source-hint')).toHaveText('No ZIP selected.')
      await page.setInputFiles('[data-testid="import-zip-input"]', initialPackage)
      await submitImport(page)
      await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)

      await expect(page.getByTestId('post-import-trigger')).toBeVisible()
      await openImportMenu(page)
      await activateImportMode(page, 'zip')
      await page.setInputFiles('[data-testid="import-zip-input"]', updatedPackage)
      await submitImport(page)
      await expect(page).toHaveURL(/\/admin\/collections\/posts\/[a-zA-Z0-9-_]+/)

      await page.goto('http://localhost:3000/zh-hans/posts/imported-package-demo')
      await expect(page.locator('h1').first()).toHaveText('导入包示例文章（更新）')
      await expect(page.getByText('Composable Publishing Workflows')).toBeVisible()
      await expect(page.getByText('第二次导入追加了这一段')).toBeVisible()

      await page.goto('http://localhost:3000/zh-hans/posts/imported-package-demo/history')
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
      await page.goto('http://localhost:3000/admin/collections/posts/create')
      await openImportMenu(page)

      await activateImportMode(page, 'mdship')
      await page.getByTestId('import-slug-override').fill('mdship-import-demo')
      await page.getByTestId('import-locale-override').selectOption('zh-Hans')
      await expect(page.getByTestId('import-source-hint')).toHaveText('No MDship folder selected.')

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

      await page.goto('http://localhost:3000/zh-hans/posts/mdship-import-demo')
      await expect(page.locator('h1').first()).toHaveText('MDship 导入示例文章（更新）')
      await expect(page.getByText('Composable Publishing Workflows')).toBeVisible()
      await expect(page.getByText('这段文字来自第二次 mdship 工作区导入')).toBeVisible()
    } finally {
      await workspaceFiles.cleanup()
    }
  })
})
