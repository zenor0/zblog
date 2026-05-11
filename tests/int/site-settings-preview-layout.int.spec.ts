import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('site settings preview layout styles', () => {
  it('keeps sticky previews below the Payload action bar', () => {
    const footerPreviewStyles = readProjectFile(
      'src/features/site-settings/admin/site-footer-preview.scss',
    )
    const articlePreviewStyles = readProjectFile(
      'src/features/article/admin/article-layout-preview.scss',
    )

    expect(footerPreviewStyles).toContain('--site-settings-preview-sticky-offset')
    expect(footerPreviewStyles).toContain('top: var(--site-settings-preview-sticky-offset)')
    expect(articlePreviewStyles).toContain('top: var(--site-settings-preview-sticky-offset)')
    expect(footerPreviewStyles).not.toMatch(/^\s*top:\s*var\(--base\);/m)
    expect(articlePreviewStyles).not.toMatch(/^\s*top:\s*var\(--base\);/m)
  })
})
