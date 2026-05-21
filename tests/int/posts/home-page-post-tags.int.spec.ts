import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function readProjectFile(relativePath: string) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

describe('home page post tags', () => {
  it('shows only authored post tags and not generated editorial status labels', () => {
    const source = readProjectFile('src/app/(frontend)/[locale]/page.tsx')

    expect(source).toContain('featuredPost.tags.map')
    expect(source).toContain('post.tags.map')
    expect(source).not.toContain("common('editorialStatus')")
    expect(source).not.toContain("common('machineStatus')")
  })
})
