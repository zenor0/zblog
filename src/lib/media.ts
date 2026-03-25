import path from 'node:path'

import type { Media } from '@/payload-types'

import { mediaPreviewDir, mediaUploadDir } from '@/lib/uploads'

const localOrigin = 'http://zblog.local'
const payloadMediaPrefixes = ['/api/media/file/', '/media/'] as const
const pdfPreviewSuffixPattern = /\.page-(\d+)\.svg$/i

export type MediaKind = 'image' | 'pdf' | 'unknown' | 'vector'

export type MediaRenderOptions = {
  page?: number
  watermarkToken?: null | string
}

type MediaLike = Pick<
  Media,
  | 'alt'
  | 'caption'
  | 'credit'
  | 'filename'
  | 'height'
  | 'mimeType'
  | 'previewSVGURL'
  | 'url'
  | 'width'
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

function normalizeMediaText(value?: null | string): null | string {
  const normalized = value?.trim()

  return normalized && normalized.length > 0 ? normalized : null
}

function usesDefaultPDFPreview(options: MediaRenderOptions = {}): boolean {
  return (
    (options.page === undefined || options.page === 1) &&
    (!options.watermarkToken || options.watermarkToken.trim().length === 0)
  )
}

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
  if (usesDefaultPDFPreview(options)) {
    const previewURL = buildPDFPreviewURL(sourceURL, 1)

    if (previewURL) {
      return previewURL
    }
  }

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

export function buildPDFPreviewFilename(filename: string, page = 1): string {
  return `${filename}.page-${page}.svg`
}

export function getSourceFilenameFromPDFPreviewFilename(previewFilename: string): null | string {
  const match = previewFilename.match(pdfPreviewSuffixPattern)

  if (!match) {
    return null
  }

  const sourceFilename = previewFilename.slice(0, match.index)

  return sourceFilename.length > 0 ? sourceFilename : null
}

export function buildPDFPreviewURL(sourceURL: string, page = 1): null | string {
  const sourceFilename = getMediaFilename(sourceURL)

  if (!sourceFilename) {
    return null
  }

  const searchParams = new URLSearchParams({
    filename: buildPDFPreviewFilename(sourceFilename, page),
  })

  return `/api/media/preview?${searchParams.toString()}`
}

export function resolveLocalMediaFilePath(filename: string): null | string {
  return resolveSafePath(mediaUploadDir, filename)
}

export function resolveLocalMediaPreviewPath(previewFilename: string): null | string {
  return resolveSafePath(mediaPreviewDir, previewFilename)
}

export function resolveMediaCaption(args: {
  alt?: null | string
  caption?: null | string
  title?: null | string
}): null | string {
  return normalizeMediaText(args.caption) ?? normalizeMediaText(args.title) ?? normalizeMediaText(args.alt)
}

export function resolveAttachmentDescription(args: {
  caption?: null | string
  description?: null | string
}): null | string {
  return normalizeMediaText(args.description) ?? normalizeMediaText(args.caption)
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
    previewURL:
      kind === 'pdf'
        ? usesDefaultPDFPreview(args.options)
          ? args.media?.previewSVGURL ?? buildMediaRenderURL(sourceURL, args.options)
          : buildMediaRenderURL(sourceURL, args.options)
        : kind === 'unknown'
          ? null
          : sourceURL,
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

  return resolveSafePath(mediaUploadDir, relativePath)
}
