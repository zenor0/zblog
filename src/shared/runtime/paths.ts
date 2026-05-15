import path from 'node:path'

const defaultRuntimeStateDir = '.data'

function getRuntimeStateDirInput(): string {
  const configuredStateDir = process.env.ZBLOG_STATE_DIR?.trim()

  return configuredStateDir && configuredStateDir.length > 0
    ? configuredStateDir
    : defaultRuntimeStateDir
}

export const runtimeStateDir = path.resolve(process.cwd(), getRuntimeStateDirInput())

export function resolveRuntimePath(...segments: string[]): string {
  return path.resolve(runtimeStateDir, ...segments)
}

export const defaultDatabasePath = resolveRuntimePath('zblog.db')
export const defaultDatabaseURL = `file:${defaultDatabasePath}`
export const mediaUploadDir = resolveRuntimePath('media')
export const mediaPreviewDir = resolveRuntimePath('media-previews')
export const seedAssetsDir = resolveRuntimePath('seed-assets')
export const siteDataExportDir = resolveRuntimePath('exports')
export const siteDataImportDir = resolveRuntimePath('imports')
