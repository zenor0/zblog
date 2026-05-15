export const siteDataExportManifestKind = 'zblog.siteDataExport'
export const siteDataExportManifestVersion = 1

export const siteDataTransferGroupIDs = [
  'site-settings',
  'frontend-variants',
  'posts',
  'media',
  'post-versions',
  'post-view-metrics',
] as const

export type SiteDataTransferGroupID = (typeof siteDataTransferGroupIDs)[number]

export type SiteDataExportPresetID = 'configuration' | 'configuration-assets' | 'content' | 'full'

export type SiteDataExportPreset = {
  description: string
  groups: SiteDataTransferGroupID[]
  id: SiteDataExportPresetID
  label: string
}

export type SiteDataExportManifest = {
  counts?: Partial<Record<SiteDataTransferGroupID, number>>
  exportedAt: string
  exportID: string
  groups: SiteDataTransferGroupID[]
  kind: typeof siteDataExportManifestKind
  version: typeof siteDataExportManifestVersion
}

export type SiteDataTransferGroupDiff = {
  conflicts: number
  creates: number
  skips: number
  updates: number
  warnings: string[]
}

export type SiteDataTransferDiff = {
  groups: Partial<Record<SiteDataTransferGroupID, SiteDataTransferGroupDiff>>
}

export type SiteDataTransferDiffSummary = {
  defaultSelectedGroups: SiteDataTransferGroupID[]
  hasChanges: boolean
  totals: {
    conflicts: number
    creates: number
    skips: number
    updates: number
    warnings: number
  }
}

export const siteDataExportPresets = {
  configuration: {
    description: 'Site settings and frontend variant selections only.',
    groups: ['site-settings', 'frontend-variants'],
    id: 'configuration',
    label: 'Configuration',
  },
  'configuration-assets': {
    description: 'Configuration plus the media library, without posts or version history.',
    groups: ['site-settings', 'frontend-variants', 'media'],
    id: 'configuration-assets',
    label: 'Configuration + media',
  },
  content: {
    description: 'Posts, media, and post version history.',
    groups: ['posts', 'media', 'post-versions'],
    id: 'content',
    label: 'Content backup',
  },
  full: {
    description: 'All site data except user accounts and sessions.',
    groups: [
      'site-settings',
      'frontend-variants',
      'posts',
      'media',
      'post-versions',
      'post-view-metrics',
    ],
    id: 'full',
    label: 'Full backup',
  },
} as const satisfies Record<SiteDataExportPresetID, SiteDataExportPreset>

const groupOrder = new Map(siteDataTransferGroupIDs.map((group, index) => [group, index]))

export function isSiteDataTransferGroupID(value: unknown): value is SiteDataTransferGroupID {
  return (
    typeof value === 'string' && siteDataTransferGroupIDs.includes(value as SiteDataTransferGroupID)
  )
}

export function normalizeDataTransferGroups(input: unknown): SiteDataTransferGroupID[] {
  const values = Array.isArray(input) ? input : []
  const selected = new Set<SiteDataTransferGroupID>()

  values.forEach((value) => {
    if (isSiteDataTransferGroupID(value)) {
      selected.add(value)
    }
  })

  return [...selected].sort((left, right) => {
    return (groupOrder.get(left) ?? 0) - (groupOrder.get(right) ?? 0)
  })
}

export function getPresetGroups(
  presetID: SiteDataExportPresetID | null | string | undefined,
): SiteDataTransferGroupID[] {
  const preset =
    typeof presetID === 'string' && presetID in siteDataExportPresets
      ? siteDataExportPresets[presetID as SiteDataExportPresetID]
      : siteDataExportPresets.configuration

  return [...preset.groups]
}

export function normalizeArchiveEntryPath(value: string): null | string {
  const rawPath = value.replace(/\\/g, '/').trim()

  if (!rawPath || rawPath.startsWith('/') || rawPath.endsWith('/')) {
    return null
  }

  const segments: string[] = []

  for (const segment of rawPath.split('/')) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      return null
    }

    segments.push(segment)
  }

  return segments.length > 0 ? segments.join('/') : null
}

export function assertValidSiteDataExportManifest(
  value: unknown,
): asserts value is SiteDataExportManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('Export manifest must be an object.')
  }

  const manifest = value as Partial<SiteDataExportManifest>

  if (manifest.kind !== siteDataExportManifestKind) {
    throw new Error('Export manifest has an unsupported kind.')
  }

  if (manifest.version !== siteDataExportManifestVersion) {
    throw new Error('Export manifest has an unsupported version.')
  }

  if (typeof manifest.exportID !== 'string' || manifest.exportID.trim().length === 0) {
    throw new Error('Export manifest is missing an export ID.')
  }

  if (typeof manifest.exportedAt !== 'string' || Number.isNaN(Date.parse(manifest.exportedAt))) {
    throw new Error('Export manifest is missing a valid export date.')
  }

  if (!Array.isArray(manifest.groups) || manifest.groups.length === 0) {
    throw new Error('Export manifest must list at least one group.')
  }

  const unknownGroup = manifest.groups.find((group) => !isSiteDataTransferGroupID(group))

  if (unknownGroup) {
    throw new Error(`Export manifest contains an unknown group: ${String(unknownGroup)}.`)
  }
}

export function createEmptyGroupDiff(): SiteDataTransferGroupDiff {
  return {
    conflicts: 0,
    creates: 0,
    skips: 0,
    updates: 0,
    warnings: [],
  }
}

export function groupDiffHasChanges(diff: SiteDataTransferGroupDiff): boolean {
  return diff.creates > 0 || diff.updates > 0 || diff.conflicts > 0 || diff.warnings.length > 0
}

export function createSiteDataTransferDiffSummary(
  diff: SiteDataTransferDiff,
): SiteDataTransferDiffSummary {
  const totals = {
    conflicts: 0,
    creates: 0,
    skips: 0,
    updates: 0,
    warnings: 0,
  }
  const defaultSelectedGroups: SiteDataTransferGroupID[] = []

  siteDataTransferGroupIDs.forEach((group) => {
    const groupDiff = diff.groups[group]

    if (!groupDiff) {
      return
    }

    totals.conflicts += groupDiff.conflicts
    totals.creates += groupDiff.creates
    totals.skips += groupDiff.skips
    totals.updates += groupDiff.updates
    totals.warnings += groupDiff.warnings.length

    if (groupDiffHasChanges(groupDiff)) {
      defaultSelectedGroups.push(group)
    }
  })

  return {
    defaultSelectedGroups,
    hasChanges:
      totals.conflicts > 0 || totals.creates > 0 || totals.updates > 0 || totals.warnings > 0,
    totals,
  }
}
