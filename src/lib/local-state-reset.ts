import path from 'node:path'

import { runtimeStateDir } from '@/lib/runtime-paths'

export type LocalStateResetPlan = {
  label: string
  targetPath: string
}

export function isPathInsideDirectory(targetPath: string, directory: string): boolean {
  const relativePath = path.relative(path.resolve(directory), path.resolve(targetPath))

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}

export function getLocalStateResetPlan(): LocalStateResetPlan {
  return {
    label: 'local runtime state',
    targetPath: runtimeStateDir,
  }
}

export function assertSafeLocalStateReset(plan: LocalStateResetPlan): void {
  const targetPath = path.resolve(plan.targetPath)
  const projectRoot = process.cwd()

  if (targetPath === path.parse(targetPath).root) {
    throw new Error('Refusing to reset the filesystem root.')
  }

  if (targetPath === projectRoot) {
    throw new Error('Refusing to reset the project root.')
  }

  if (!isPathInsideDirectory(targetPath, projectRoot)) {
    throw new Error(`Refusing to reset a path outside this project: ${targetPath}`)
  }
}
