import path from 'node:path'

import { mediaPreviewDir, mediaUploadDir } from '@/lib/uploads'

const localOrigin = 'http://zblog.local'
const payloadMediaPrefixes = ['/api/media/file/', '/media/'] as const

function resolveSafePath(rootDir: string, relativePath: string): null | string {
  if (relativePath.length === 0) {
    return null
  }

  const resolvedPath = path.resolve(rootDir, relativePath)
  const normalizedRoot = `${path.resolve(rootDir)}${path.sep}`

  if (!resolvedPath.startsWith(normalizedRoot)) {
    return null
  }

  return resolvedPath
}

function getPathnameFromSource(sourceURL: string): null | string {
  try {
    return new URL(sourceURL, localOrigin).pathname
  } catch {
    return null
  }
}

export function resolveLocalMediaFilePath(filename: string): null | string {
  return resolveSafePath(mediaUploadDir, filename)
}

export function resolveLocalMediaPreviewPath(previewFilename: string): null | string {
  return resolveSafePath(mediaPreviewDir, previewFilename)
}

export function resolveLocalMediaPath(sourceURL: string): null | string {
  const pathname = getPathnameFromSource(sourceURL)

  if (!pathname) {
    return null
  }

  const matchedPrefix = payloadMediaPrefixes.find((prefix) => pathname.startsWith(prefix))

  if (!matchedPrefix) {
    return null
  }

  const rawRelativePath = pathname.slice(matchedPrefix.length)

  if (rawRelativePath.length === 0) {
    return null
  }

  const relativePath = decodeURIComponent(rawRelativePath)

  if (relativePath.length === 0) {
    return null
  }

  return resolveSafePath(mediaUploadDir, relativePath)
}
