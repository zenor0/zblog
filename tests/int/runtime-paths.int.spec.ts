import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  defaultDatabasePath,
  defaultDatabaseURL,
  mediaPreviewDir,
  mediaUploadDir,
  resolveRuntimePath,
  runtimeStateDir,
  seedAssetsDir,
  siteDataExportDir,
  siteDataImportDir,
} from '@/shared/runtime/paths'

describe('runtime paths', () => {
  it('keeps generated local state under the .data directory by default', () => {
    expect(runtimeStateDir).toBe(path.resolve(process.cwd(), '.data'))
    expect(defaultDatabasePath).toBe(path.resolve(process.cwd(), '.data', 'zblog.db'))
    expect(defaultDatabaseURL).toBe(`file:${path.resolve(process.cwd(), '.data', 'zblog.db')}`)
    expect(mediaUploadDir).toBe(path.resolve(process.cwd(), '.data', 'media'))
    expect(mediaPreviewDir).toBe(path.resolve(process.cwd(), '.data', 'media-previews'))
    expect(seedAssetsDir).toBe(path.resolve(process.cwd(), '.data', 'seed-assets'))
    expect(siteDataExportDir).toBe(path.resolve(process.cwd(), '.data', 'exports'))
    expect(siteDataImportDir).toBe(path.resolve(process.cwd(), '.data', 'imports'))
  })

  it('resolves runtime subpaths from the central state directory', () => {
    expect(resolveRuntimePath('media', 'nested', 'asset.png')).toBe(
      path.resolve(process.cwd(), '.data', 'media', 'nested', 'asset.png'),
    )
  })
})
