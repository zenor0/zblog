import fs from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

const projectRoot = path.resolve(__dirname, '../../..')

function resolveProjectPath(relativePath: string) {
  return path.join(projectRoot, relativePath)
}

function readProjectFile(relativePath: string) {
  return fs.readFileSync(resolveProjectPath(relativePath), 'utf8')
}

function listSourceFiles(relativeDir: string): string[] {
  const baseDir = resolveProjectPath(relativeDir)

  if (!fs.existsSync(baseDir)) {
    return []
  }

  const files: string[] = []
  const queue = [baseDir]

  while (queue.length > 0) {
    const currentDir = queue.shift()

    if (!currentDir) {
      continue
    }

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        queue.push(fullPath)
        continue
      }

      if (/\.(css|ts|tsx)$/.test(entry.name)) {
        files.push(path.relative(projectRoot, fullPath))
      }
    }
  }

  return files.sort()
}

function extractInternalImports(relativePath: string) {
  const source = readProjectFile(relativePath)
  const importSpecifiers = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
    (match) => match[1] ?? '',
  )

  return importSpecifiers.filter((specifier) => specifier.startsWith('@/'))
}

describe('code layout', () => {
  it('keeps integration tests grouped into feature folders', () => {
    const directIntegrationSpecs = fs
      .readdirSync(resolveProjectPath('tests/int'), {
        withFileTypes: true,
      })
      .filter((entry) => entry.isFile() && /\.int\.spec\.tsx?$/.test(entry.name))
      .map((entry) => entry.name)

    expect(directIntegrationSpecs).toEqual([])
  })

  it('documents the target hybrid feature-first layout', () => {
    const layoutDocPath = 'docs/development/code-layout.md'

    expect(fs.existsSync(resolveProjectPath(layoutDocPath))).toBe(true)

    const source = readProjectFile(layoutDocPath)

    expect(source).toContain('src/features')
    expect(source).toContain('src/shared')
    expect(source).toContain('Do not reintroduce')
    expect(source).toContain('no longer an active module layer')
  })

  it('keeps the frontend stylesheet as a small entrypoint that imports split CSS modules', () => {
    const source = readProjectFile('src/app/(frontend)/styles.css')

    expect(source).toContain("@import 'tailwindcss';")
    expect(source).toContain("@import 'tw-animate-css';")
    expect(source).toContain("@import 'shadcn/tailwind.css';")
    expect(source).toContain("@import '../../styles/frontend/tokens.css';")
    expect(source).toContain("@import '../../styles/frontend/base.css';")
    expect(source).toContain("@import '../../styles/frontend/editorial.css';")
    expect(source).toContain("@import '../../styles/frontend/article.css';")
    expect(source).toContain("@import '../../styles/frontend/dev.css';")
    expect(source).toContain("@import '../../styles/frontend/preview.css';")

    const significantLines = source
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('@import'))

    expect(significantLines).toEqual([])
  })

  it('keeps migrated implementations in features/shared and removes thin legacy shims', () => {
    const implementationPaths = [
      'src/shared/auth/access.ts',
      'src/shared/i18n/locales.ts',
      'src/shared/payload/client.ts',
      'src/shared/runtime/paths.ts',
      'src/shared/runtime/directories.ts',
      'src/shared/runtime/local-state-reset.ts',
      'src/shared/runtime/request-origin.ts',
      'src/shared/content/slugs.ts',
      'src/shared/content/diff.ts',
      'src/shared/content/seo.ts',
      'src/shared/i18n/translation.ts',
      'src/shared/utils/cn.ts',
      'src/features/article/model/article-design.ts',
      'src/features/article/model/article-layout.ts',
      'src/features/article/model/article-link-previews.ts',
      'src/features/article/model/article-block-previews.ts',
      'src/features/article/model/bibliography.ts',
      'src/features/article/model/citations.ts',
      'src/features/article/model/dev-reference.ts',
      'src/features/article/model/markdown-headings.ts',
      'src/features/article/markdown/index.tsx',
      'src/features/posts/server/queries.ts',
      'src/features/posts/server/post-owned-resources.ts',
      'src/features/posts/import/use-case.ts',
      'src/features/posts/preview/index.ts',
      'src/features/posts/seed/seed-blog-content.ts',
      'src/features/posts/server/preview-user.ts',
      'src/features/media/model/media.ts',
      'src/features/media/server/media-server.ts',
      'src/features/media/server/media-previews.ts',
      'src/features/media/server/pdf-preview.ts',
      'src/features/media/model/uploads.ts',
      'src/features/post-views/server/post-views.ts',
      'src/features/site-settings/model/site-settings.ts',
      'src/features/site-settings/model/site-settings-config.ts',
      'src/features/site-settings/model/site-footer-layout.ts',
      'src/features/site-settings/model/site-footer-preset.ts',
      'src/features/site-settings/model/site-footer-preview.ts',
      'src/features/article/admin/ArticleDesignRangeField.tsx',
      'src/features/article/admin/ArticleLayoutPreview.tsx',
      'src/features/article/admin/BibliographyEntryEditor.tsx',
      'src/features/article/admin/BibliographyField.tsx',
      'src/features/article/admin/bibliographyFieldModel.ts',
      'src/features/posts/admin/PostInsights.tsx',
      'src/features/posts/admin/PostLivePreviewToolbar.tsx',
      'src/features/posts/admin/PostLivePreviewView.tsx',
      'src/features/posts/admin/PostPackageImportAction.tsx',
      'src/features/posts/admin/PostPackageImportPanel.tsx',
      'src/features/posts/admin/PostTranslationManager.tsx',
      'src/features/posts/admin/TranslateLocaleAction.tsx',
      'src/features/posts/admin/TranslatePostLocaleAction.tsx',
      'src/features/posts/admin/postLivePreviewModel.ts',
      'src/features/posts/admin/postOverviewSummary.ts',
      'src/features/posts/admin/postTranslationSummary.ts',
      'src/features/site-settings/admin/SiteFooterPresetActions.tsx',
      'src/features/site-settings/admin/SiteFooterPreview.tsx',
      'src/features/site-settings/admin/SiteSettingsRawSectionEditor.tsx',
      'src/features/site-settings/admin/SiteSettingsSectionModeSwitch.tsx',
    ] as const

    const removedShimPaths = [
      'src/components/frontend/ArticleAnchorNavigation.tsx',
      'src/components/frontend/ArticleLinkPreviewLink.tsx',
      'src/components/frontend/ArticleViewTracker.tsx',
      'src/components/frontend/CollapsibleReferenceSection.tsx',
      'src/components/frontend/FrontendLoadingSkeletons.tsx',
      'src/components/frontend/LocaleSwitcher.tsx',
      'src/components/frontend/MediaDetails.tsx',
      'src/components/frontend/MediaSurface.tsx',
      'src/components/frontend/PostArticle.tsx',
      'src/components/frontend/PostArticleNotices.tsx',
      'src/components/frontend/PostArticleSupplementary.tsx',
      'src/components/frontend/PostLivePreviewRefresh.tsx',
      'src/components/frontend/PostTableOfContents.tsx',
      'src/components/frontend/SiteFooter.tsx',
      'src/components/frontend/SiteFooterPreviewFrame.tsx',
      'src/components/frontend/ThemeSwitcher.tsx',
      'src/components/frontend/article-anchor-navigation-utils.ts',
      'src/components/frontend/markdown-components/FeatureGrid.tsx',
      'src/components/frontend/markdown-components/NoticeCard.tsx',
      'src/components/frontend/site-footer.ts',
      'src/components/frontend/theme.ts',
      'src/components/payload/ArticleDesignRangeField.tsx',
      'src/components/payload/ArticleLayoutPreview.tsx',
      'src/components/payload/BibliographyEntryEditor.tsx',
      'src/components/payload/BibliographyField.tsx',
      'src/components/payload/PostInsights.tsx',
      'src/components/payload/PostLivePreviewToolbar.tsx',
      'src/components/payload/PostLivePreviewView.tsx',
      'src/components/payload/PostPackageImportAction.tsx',
      'src/components/payload/PostPackageImportPanel.tsx',
      'src/components/payload/PostTranslationManager.tsx',
      'src/components/payload/SiteFooterPresetActions.tsx',
      'src/components/payload/SiteFooterPreview.tsx',
      'src/components/payload/SiteSettingsRawSectionEditor.tsx',
      'src/components/payload/SiteSettingsSectionModeSwitch.tsx',
      'src/components/payload/TranslateLocaleAction.tsx',
      'src/components/payload/TranslatePostLocaleAction.tsx',
      'src/components/payload/bibliographyFieldModel.ts',
      'src/components/payload/postLivePreviewModel.ts',
      'src/components/payload/postOverviewSummary.ts',
      'src/components/payload/postTranslationSummary.ts',
      'src/lib/access.ts',
      'src/lib/article-block-previews.ts',
      'src/lib/article-design.ts',
      'src/lib/article-layout.ts',
      'src/lib/article-link-previews.ts',
      'src/lib/bibliography.ts',
      'src/lib/citations.ts',
      'src/lib/dev-reference.ts',
      'src/lib/diff.ts',
      'src/lib/locales.ts',
      'src/lib/local-state-reset.ts',
      'src/lib/markdown-headings.ts',
      'src/lib/markdown/article-elements.ts',
      'src/lib/markdown/article-syntax.ts',
      'src/lib/markdown/code-highlighting.ts',
      'src/lib/markdown/component-registry.tsx',
      'src/lib/markdown/index.tsx',
      'src/lib/markdown/plugins.ts',
      'src/lib/markdown/renderers.tsx',
      'src/lib/markdown/types.ts',
      'src/lib/media-previews.ts',
      'src/lib/media-server.ts',
      'src/lib/media.ts',
      'src/lib/payload.ts',
      'src/lib/pdf-preview.ts',
      'src/lib/post-owned-resources.ts',
      'src/lib/post-package-import.ts',
      'src/lib/post-views.ts',
      'src/lib/posts.ts',
      'src/lib/preview-user.ts',
      'src/lib/preview.ts',
      'src/lib/request-origin.ts',
      'src/lib/runtime-directories.ts',
      'src/lib/runtime-paths.ts',
      'src/lib/seed-blog-content.ts',
      'src/lib/seo.ts',
      'src/lib/site-footer-layout.ts',
      'src/lib/site-footer-preset.ts',
      'src/lib/site-footer-preview.ts',
      'src/lib/site-settings-config.ts',
      'src/lib/site-settings.ts',
      'src/lib/slugs.ts',
      'src/lib/translation.ts',
      'src/lib/uploads.ts',
      'src/lib/utils.ts',
    ] as const

    expect(fs.existsSync(resolveProjectPath('src/lib'))).toBe(false)

    for (const implementationPath of implementationPaths) {
      expect(fs.existsSync(resolveProjectPath(implementationPath)), implementationPath).toBe(true)
    }

    for (const shimPath of removedShimPaths) {
      expect(fs.existsSync(resolveProjectPath(shimPath)), shimPath).toBe(false)
    }
  })

  it('removes imports and payload component strings that point at deleted shim namespaces', () => {
    const legacySpecifiers = ['@/components/frontend/', '@/components/payload/', '@/lib/']
    const legacyComponentStrings = ['/components/payload/']

    for (const filePath of [...listSourceFiles('src'), ...listSourceFiles('tests')]) {
      if (filePath === 'tests/int/project/code-layout.int.spec.ts') {
        continue
      }

      const source = readProjectFile(filePath)

      for (const specifier of legacySpecifiers) {
        expect(source.includes(specifier), `${filePath} referenced ${specifier}`).toBe(false)
      }

      for (const componentPath of legacyComponentStrings) {
        expect(source.includes(componentPath), `${filePath} referenced ${componentPath}`).toBe(
          false,
        )
      }
    }
  })

  it('prevents shared modules from importing features or app layers', () => {
    const forbiddenPrefixes = ['@/features/', '@/app/']

    for (const filePath of listSourceFiles('src/shared')) {
      const imports = extractInternalImports(filePath)

      for (const specifier of imports) {
        expect(
          forbiddenPrefixes.some((prefix) => specifier.startsWith(prefix)),
          `${filePath} imported ${specifier}`,
        ).toBe(false)
      }
    }
  })

  it('prevents feature modules from importing app routes directly', () => {
    for (const filePath of listSourceFiles('src/features')) {
      const imports = extractInternalImports(filePath)

      for (const specifier of imports) {
        expect(specifier.startsWith('@/app/'), `${filePath} imported ${specifier}`).toBe(false)
      }
    }
  })
})
