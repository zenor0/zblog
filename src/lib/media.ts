import path from 'node:path'

import type { Media } from '@/payload-types'

import { mediaUploadDir } from '@/lib/uploads'

const localOrigin = 'http://zblog.local'
const payloadMediaPrefixes = ['/api/media/file/', '/media/'] as const

export type MediaKind = 'image' | 'pdf' | 'unknown' | 'vector'

export type MediaRenderOptions = {
  page?: number
  watermarkToken?: null | string
}

type MediaLike = Pick<
  Media,
  'alt' | 'caption' | 'credit' | 'filename' | 'height' | 'mimeType' | 'url' | 'width'
>

export type ResolvedMediaAsset = {
  alt: string
  caption?: null | string
  credit?: null | string
  downloadURL: string
  extensionLabel: null | string
  filename?: null | string
  height?: null | number
  kind: MediaKind
  mimeType?: null | string
  previewURL: null | string
  src: string
  width?: null | number
}

function getPathnameFromSource(sourceURL: string): null | string {
  try {
    return new URL(sourceURL, localOrigin).pathname
  } catch {
    return null
  }
}

function getExtension(sourceURL: null | string): null | string {
  if (!sourceURL) {
    return null
  }

  const pathname = getPathnameFromSource(sourceURL)

  if (!pathname) {
    return null
  }

  const extension = path.extname(pathname).trim().toLowerCase()

  return extension.length > 0 ? extension : null
}

export function getMediaLabel(sourceURL: null | string): null | string {
  const extension = getExtension(sourceURL)

  return extension ? extension.replace(/^\./, '').toUpperCase() : null
}

export function getMediaFilename(sourceURL: null | string): null | string {
  const pathname = sourceURL ? getPathnameFromSource(sourceURL) : null

  if (!pathname) {
    return null
  }

  const basename = path.basename(pathname)

  return basename.length > 0 ? basename : null
}

export function inferMediaKind(args: {
  mimeType?: null | string
  src?: null | string
}): MediaKind {
  const mimeType = args.mimeType?.trim().toLowerCase() ?? null
  const extension = getExtension(args.src ?? null)

  if (mimeType === 'application/pdf' || extension === '.pdf') {
    return 'pdf'
  }

  if (mimeType === 'image/svg+xml' || extension === '.svg') {
    return 'vector'
  }

  if (mimeType?.startsWith('image/')) {
    return 'image'
  }

  if (
    extension &&
    ['.avif', '.bmp', '.gif', '.heic', '.heif', '.ico', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp'].includes(
      extension,
    )
  ) {
    return 'image'
  }

  return 'unknown'
}

export function buildMediaRenderURL(sourceURL: string, options: MediaRenderOptions = {}): string {
  const searchParams = new URLSearchParams({
    src: sourceURL,
  })

  if (typeof options.page === 'number' && Number.isFinite(options.page) && options.page > 1) {
    searchParams.set('page', String(Math.floor(options.page)))
  }

  if (typeof options.watermarkToken === 'string' && options.watermarkToken.trim().length > 0) {
    searchParams.set('wm', options.watermarkToken.trim())
  }

  return `/api/media/render?${searchParams.toString()}`
}

export function resolveMediaAsset(args: {
  alt?: null | string
  media?: MediaLike | null
  options?: MediaRenderOptions
  src?: null | string
}): ResolvedMediaAsset | null {
  const sourceURL = args.src ?? args.media?.url ?? null

  if (!sourceURL) {
    return null
  }

  const kind = inferMediaKind({
    mimeType: args.media?.mimeType,
    src: sourceURL,
  })
  const alt =
    args.alt?.trim() ||
    args.media?.alt?.trim() ||
    args.media?.filename?.trim() ||
    getMediaFilename(sourceURL) ||
    'Media asset'

  return {
    alt,
    caption: args.media?.caption ?? null,
    credit: args.media?.credit ?? null,
    downloadURL: sourceURL,
    extensionLabel: getMediaLabel(args.media?.filename ? `/${args.media.filename}` : sourceURL),
    filename: args.media?.filename ?? getMediaFilename(sourceURL),
    height: args.media?.height ?? null,
    kind,
    mimeType: args.media?.mimeType ?? null,
    previewURL: kind === 'pdf' ? buildMediaRenderURL(sourceURL, args.options) : kind === 'unknown' ? null : sourceURL,
    src: sourceURL,
    width: args.media?.width ?? null,
  }
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

  const resolvedPath = path.resolve(mediaUploadDir, relativePath)
  const normalizedRoot = `${path.resolve(mediaUploadDir)}${path.sep}`

  if (!resolvedPath.startsWith(normalizedRoot)) {
    return null
  }

  return resolvedPath
}
