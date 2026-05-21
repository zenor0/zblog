import { describe, expect, it, vi } from 'vitest'

import type { Project } from '@/payload-types'

import {
  getProjectTimestamp,
  isProjectIndexable,
  sortProjectsForDisplay,
} from '@/features/projects/server/queries'

function createProject(overrides: Partial<Project>): Project {
  return {
    id: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    slug: 'project',
    status: 'active',
    summary: 'Project summary',
    title: 'Project',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  } as Project
}

describe('project queries', () => {
  it('treats noindex projects as non-indexable', () => {
    expect(isProjectIndexable(null)).toBe(false)
    expect(isProjectIndexable(createProject({ seo: { noindex: false } }))).toBe(true)
    expect(isProjectIndexable(createProject({ seo: { noindex: true } }))).toBe(false)
  })

  it('sorts featured projects first, then editorial order, then newest timestamp', () => {
    const projects = [
      createProject({
        featured: false,
        id: 1,
        publishedAt: '2026-01-05T00:00:00.000Z',
        slug: 'third',
        sortOrder: 20,
      }),
      createProject({
        featured: true,
        id: 2,
        publishedAt: '2026-01-03T00:00:00.000Z',
        slug: 'first',
        sortOrder: 10,
      }),
      createProject({
        featured: true,
        id: 3,
        publishedAt: '2026-01-06T00:00:00.000Z',
        slug: 'second',
        sortOrder: 20,
      }),
    ]

    expect(sortProjectsForDisplay(projects).map((project) => project.slug)).toEqual([
      'first',
      'second',
      'third',
    ])
  })

  it('uses published, updated, then created timestamps for display', () => {
    expect(
      getProjectTimestamp(
        createProject({
          createdAt: '2026-01-01T00:00:00.000Z',
          publishedAt: '2026-01-03T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
      ),
    ).toBe('2026-01-03T00:00:00.000Z')
    expect(
      getProjectTimestamp(
        createProject({
          createdAt: '2026-01-01T00:00:00.000Z',
          publishedAt: null,
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
      ),
    ).toBe('2026-01-02T00:00:00.000Z')
  })
})
