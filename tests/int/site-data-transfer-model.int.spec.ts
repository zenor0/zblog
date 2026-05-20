import { describe, expect, it } from 'vitest'

import {
  assertValidSiteDataExportManifest,
  createSiteDataTransferDiffSummary,
  normalizeArchiveEntryPath,
  normalizeDataTransferGroups,
  siteDataExportPresets,
  siteDataTransferGroupIDs,
  type SiteDataTransferDiff,
} from '@/features/site-data-transfer/model/site-data-transfer'

describe('site data transfer model', () => {
  it('keeps full exports admin-safe and excludes user data', () => {
    expect(siteDataExportPresets.full.groups).toEqual([
      'site-settings',
      'frontend-variants',
      'posts',
      'media',
      'post-versions',
      'post-view-metrics',
    ])
    expect(siteDataTransferGroupIDs).not.toContain('users')
  })

  it('describes presets as Payload data exports instead of raw database backups', () => {
    expect(siteDataExportPresets.content.label).toBe('Content export')
    expect(siteDataExportPresets.full.label).toBe('Full site data export')
    expect(siteDataExportPresets.content.description).toContain('Payload data')
    expect(siteDataExportPresets.full.description).toContain('not a raw SQLite snapshot')
  })

  it('normalizes selected groups and drops unknown values', () => {
    expect(
      normalizeDataTransferGroups(['posts', 'users', 'media', 'posts', 'site-settings']),
    ).toEqual(['site-settings', 'posts', 'media'])
  })

  it('rejects unsafe archive paths', () => {
    expect(normalizeArchiveEntryPath('data/export.json')).toBe('data/export.json')
    expect(normalizeArchiveEntryPath('../secrets.txt')).toBeNull()
    expect(normalizeArchiveEntryPath('/absolute/secrets.txt')).toBeNull()
    expect(normalizeArchiveEntryPath('data/../manifest.json')).toBeNull()
    expect(normalizeArchiveEntryPath('nested/../../secrets.txt')).toBeNull()
  })

  it('validates zblog export manifests', () => {
    expect(() =>
      assertValidSiteDataExportManifest({
        exportedAt: '2026-05-15T00:00:00.000Z',
        exportID: 'zblog-export-test',
        groups: ['site-settings'],
        kind: 'zblog.siteDataExport',
        version: 1,
      }),
    ).not.toThrow()

    expect(() =>
      assertValidSiteDataExportManifest({
        exportedAt: '2026-05-15T00:00:00.000Z',
        exportID: 'zblog-export-test',
        groups: ['users'],
        kind: 'zblog.siteDataExport',
        version: 1,
      }),
    ).toThrow('unknown group')
  })

  it('summarizes grouped import diffs and selects changed groups by default', () => {
    const diff: SiteDataTransferDiff = {
      groups: {
        media: {
          conflicts: 0,
          creates: 2,
          skips: 1,
          updates: 0,
          warnings: [],
        },
        posts: {
          conflicts: 1,
          creates: 0,
          skips: 0,
          updates: 1,
          warnings: ['One post has an unresolved hero image.'],
        },
        'site-settings': {
          conflicts: 0,
          creates: 0,
          skips: 1,
          updates: 0,
          warnings: [],
        },
      },
    }

    expect(createSiteDataTransferDiffSummary(diff)).toEqual({
      defaultSelectedGroups: ['posts', 'media'],
      hasChanges: true,
      totals: {
        conflicts: 1,
        creates: 2,
        skips: 2,
        updates: 1,
        warnings: 1,
      },
    })
  })
})
