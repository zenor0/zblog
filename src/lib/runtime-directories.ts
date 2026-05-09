import fs from 'node:fs'

import { mediaPreviewDir, mediaUploadDir, runtimeStateDir, seedAssetsDir } from '@/lib/runtime-paths'

export function ensureRuntimeDirectories(): void {
  for (const directory of [runtimeStateDir, mediaUploadDir, mediaPreviewDir, seedAssetsDir]) {
    fs.mkdirSync(directory, {
      recursive: true,
    })
  }
}
