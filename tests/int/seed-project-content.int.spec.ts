import { describe, expect, it } from 'vitest'

import { seedProjectCopy, seedProjectSlugs } from '@/features/projects/seed/seed-project-content'
import { localeCodes } from '@/shared/i18n/locales'

describe('seed project content', () => {
  it('defines visible seed projects for every supported locale', () => {
    expect(seedProjectSlugs).toEqual(['zblog-project-system', 'payload-publishing-workbench'])

    for (const slug of seedProjectSlugs) {
      for (const locale of localeCodes) {
        const copy = seedProjectCopy[slug][locale]

        expect(copy.title.trim()).toBeTruthy()
        expect(copy.summary.trim()).toBeTruthy()
        expect(copy.details).toContain('\n\n')
      }
    }
  })

  it('includes the project shown by frontend smoke tests', () => {
    expect(seedProjectCopy['zblog-project-system'].en.title).toBe('ZBlog Project System')
    expect(seedProjectCopy['zblog-project-system']['zh-Hans'].title).toBe('ZBlog 项目系统')
  })
})
