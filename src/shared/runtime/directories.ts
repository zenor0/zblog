import fs from 'node:fs'

import {
  mediaPreviewDir,
  mediaUploadDir,
  runtimeStateDir,
  seedAssetsDir,
  siteDataExportDir,
  siteDataImportDir,
} from '@/shared/runtime/paths'

export function ensureRuntimeDirectories(): void {
  for (const directory of [
    runtimeStateDir,
    mediaUploadDir,
    mediaPreviewDir,
    seedAssetsDir,
    siteDataExportDir,
    siteDataImportDir,
  ]) {
    fs.mkdirSync(directory, {
      recursive: true,
    })
  }
}
