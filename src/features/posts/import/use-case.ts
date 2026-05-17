import fs from 'fs/promises'
import os from 'os'
import path from 'path'

import { unzip } from 'fflate'
import matter from 'gray-matter'
import type { Payload, PayloadRequest } from 'payload'

import { getBibliographySource, type BibliographySource } from '@/features/article/model/bibliography'
import {
  normalizePostVisibility,
  type PostVisibility,
} from '@/features/posts/model/post-visibility'
import { defaultLocale, normalizeLocale, type AppLocale } from '@/shared/i18n/locales'
import { slugify } from '@/shared/content/slugs'
import { extractCitationKeys } from '@/features/article/model/citations'
import type { Media, Post, User } from '@/payload-types'

const markdownExtensionPattern = /\.(md|markdown)$/i
const bibliographyExtensionPattern = /\.bib$/i
const maxArchiveEntryCount = 200
const maxArchiveUncompressedBytes = 50 * 1024 * 1024
const markdownAssetPattern = /(!?)\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g

type ArchiveEntry = {
  bytes: Buffer
  path: string
  text?: string
}

export type ImportedWorkspaceFile = {
  file: File
  path: string
}

export type ImportPostOverrides = {
  excerpt?: string
  locale?: AppLocale
  slug?: string
  status?: 'draft' | 'published'
  tags?: string[]
  title?: string
  visibility?: PostVisibility
}

type AttachmentInput = {
  description?: string
  label?: string
  path: string
}

type ParsedMarkdownDocument = {
  attachments: AttachmentInput[]
  bibliographyDescription?: string
  bibliographyPath?: string | null
  bibliographyTitle?: string
  content: string
  directory: string
  excerpt?: string
  hasAttachmentsField: boolean
  hasBibliographyField: boolean
  hasHeroImageField: boolean
  hasLocaleField: boolean
  hasTagsField: boolean
  hasVisibilityField: boolean
  heroImagePath?: string | null
  locale: AppLocale
  path: string
  slug: string
  status: 'draft' | 'published'
  tags: string[]
  title: string
  translatedAt?: string
  translatedFromLocale?: string
  translationProvider?: string
  translationStatus?: 'machine' | 'original' | 'reviewed'
  visibility: PostVisibility
}

type ParsedBibliographySource = {
  description?: string
  filename: string
  path: string
  source: string
  title: string
}

type ParsedPostPackage = {
  bibliography: ParsedBibliographySource | null
  createLocale: AppLocale
  defaultDocument: ParsedMarkdownDocument | null
  documents: ParsedMarkdownDocument[]
  entries: Map<string, ArchiveEntry>
  slug: string
  sourceKind: 'generic' | 'mdship'
  warnings: string[]
}

type PostDocumentID = Post['id']

type AssetUsage = {
  alt?: string
  kind: 'asset' | 'attachment' | 'heroImage' | 'image'
  sourcePath: string
}

export type ImportPostPackageResult = {
  bibliographyID: null | number
  importedLocales: AppLocale[]
  importedMediaCount: number
  operation: 'created' | 'updated'
  postID: number
  slug: string
  sourceKind: 'generic' | 'mdship'
  warnings: string[]
}

type MDshipManifest = {
  bibliography?: null | string | string[]
  document?: string
  warnings?: string[]
}

type EmbeddedBibliography = BibliographySource & {
  description?: string
  title?: string
}

function unzipAsync(bytes: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(bytes, (error, entries) => {
      if (error) {
        reject(error)
        return
      }

      resolve(entries)
    })
  })
}

function normalizeArchivePath(value: string): string | null {
  const normalized = path.posix.normalize(value.replace(/\\/g, '/').trim())

  if (
    !normalized ||
    normalized === '.' ||
    normalized.endsWith('/') ||
    normalized.startsWith('../') ||
    path.posix.isAbsolute(normalized)
  ) {
    return null
  }

  return normalized
}

function isRelativeAssetReference(reference: string): boolean {
  const trimmed = reference.trim().replace(/^<|>$/g, '')

  if (!trimmed) {
    return false
  }

  return !/^(?:[a-z]+:|#|\/)/i.test(trimmed)
}

function resolvePackagePath(baseDirectory: string, reference: string): string | null {
  const trimmed = reference.trim().replace(/^<|>$/g, '')

  if (!isRelativeAssetReference(trimmed)) {
    return null
  }

  return normalizeArchivePath(path.posix.join(baseDirectory, trimmed))
}

function inferTitleFromMarkdown(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m)

  return match?.[1]?.trim()
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function parseBibliographyPath(value: unknown): string | null | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()

    return trimmed ? trimmed : undefined
  }

  if (value === null) {
    return null
  }

  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === 'string' && item.trim())

    return typeof firstString === 'string' ? firstString.trim() : undefined
  }

  return undefined
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
}

function parseAttachments(value: unknown): AttachmentInput[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const trimmed = item.trim()

        return trimmed
          ? {
              path: trimmed,
            }
          : null
      }

      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      const pathValue = typeof record.file === 'string' ? record.file.trim() : ''

      if (!pathValue) {
        return null
      }

      return {
        description: typeof record.description === 'string' ? record.description.trim() : undefined,
        label: typeof record.label === 'string' ? record.label.trim() : undefined,
        path: pathValue,
      }
    })
    .filter((item): item is AttachmentInput => Boolean(item))
}

function parseTranslationStatus(
  value: unknown,
): ParsedMarkdownDocument['translationStatus'] | undefined {
  if (value === 'original' || value === 'machine' || value === 'reviewed') {
    return value
  }

  return undefined
}

function buildEntryMap(entries: ArchiveEntry[]): Map<string, ArchiveEntry> {
  return new Map(entries.map((entry) => [entry.path, entry]))
}

async function readArchiveEntries(file: File): Promise<ArchiveEntry[]> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const archive = await unzipAsync(bytes)
  const decoder = new TextDecoder('utf-8')
  const output: ArchiveEntry[] = []
  let totalBytes = 0

  for (const [rawPath, contents] of Object.entries(archive)) {
    const normalizedPath = normalizeArchivePath(rawPath)

    if (!normalizedPath) {
      continue
    }

    totalBytes += contents.byteLength

    if (output.length >= maxArchiveEntryCount) {
      throw new Error(`Archive contains more than ${maxArchiveEntryCount} files.`)
    }

    if (totalBytes > maxArchiveUncompressedBytes) {
      throw new Error('Archive is too large after extraction.')
    }

    output.push({
      bytes: Buffer.from(contents),
      path: normalizedPath,
      text:
        bibliographyExtensionPattern.test(normalizedPath) ||
        markdownExtensionPattern.test(normalizedPath)
          ? decoder.decode(contents)
          : undefined,
    })
  }

  return output
}

async function readWorkspaceEntries(files: ImportedWorkspaceFile[]): Promise<ArchiveEntry[]> {
  const decoder = new TextDecoder('utf-8')
  const output: ArchiveEntry[] = []
  let totalBytes = 0
  const normalizedFiles = files
    .map((item) => {
      const normalizedPath = normalizeArchivePath(item.path)

      return normalizedPath
        ? {
            file: item.file,
            path: normalizedPath,
          }
        : null
    })
    .filter((item): item is { file: File; path: string } => Boolean(item))
  const topLevelDirectories = new Set(
    normalizedFiles
      .map((item) => item.path.split('/'))
      .filter((segments) => segments.length > 1)
      .map(([directory]) => directory),
  )
  const shouldStripSharedRoot =
    normalizedFiles.length > 0 &&
    normalizedFiles.every((item) => item.path.includes('/')) &&
    topLevelDirectories.size === 1
  const sharedRoot = shouldStripSharedRoot ? [...topLevelDirectories][0] : null

  for (const item of normalizedFiles) {
    const workspacePath =
      sharedRoot && item.path.startsWith(`${sharedRoot}/`)
        ? item.path.slice(sharedRoot.length + 1)
        : item.path
    const bytes = new Uint8Array(await item.file.arrayBuffer())

    totalBytes += bytes.byteLength

    if (output.length >= maxArchiveEntryCount) {
      throw new Error(`Workspace contains more than ${maxArchiveEntryCount} files.`)
    }

    if (totalBytes > maxArchiveUncompressedBytes) {
      throw new Error('Workspace is too large after normalization.')
    }

    output.push({
      bytes: Buffer.from(bytes),
      path: workspacePath,
      text:
        bibliographyExtensionPattern.test(workspacePath) ||
        markdownExtensionPattern.test(workspacePath) ||
        workspacePath.endsWith('.json')
          ? decoder.decode(bytes)
          : undefined,
    })
  }

  return output
}

function parseMarkdownDocument(entry: ArchiveEntry): ParsedMarkdownDocument {
  const parsed = matter(entry.text ?? '')
  const frontmatter = parsed.data as Record<string, unknown>
  const localeValue =
    normalizeLocale(typeof frontmatter.locale === 'string' ? frontmatter.locale : defaultLocale) ??
    null

  if (!localeValue) {
    throw new Error(`Invalid locale "${String(frontmatter.locale)}" in ${entry.path}.`)
  }

  const title =
    (typeof frontmatter.title === 'string' ? frontmatter.title.trim() : '') ||
    inferTitleFromMarkdown(parsed.content) ||
    ''

  if (!title) {
    throw new Error(`Missing title in ${entry.path}.`)
  }

  const rawSlug =
    (typeof frontmatter.slug === 'string' ? frontmatter.slug.trim() : '') ||
    slugify(title) ||
    slugify(path.posix.basename(entry.path, path.posix.extname(entry.path)))

  if (!rawSlug) {
    throw new Error(`Unable to determine a slug for ${entry.path}.`)
  }

  const rawStatus = frontmatter._status ?? frontmatter.status
  const rawVisibility = frontmatter.visibility
  const directory = path.posix.dirname(entry.path)

  return {
    attachments: parseAttachments(frontmatter.attachments),
    bibliographyDescription:
      typeof frontmatter.bibliographyDescription === 'string'
        ? frontmatter.bibliographyDescription.trim()
        : undefined,
    bibliographyPath: parseBibliographyPath(frontmatter.bibliography),
    bibliographyTitle:
      typeof frontmatter.bibliographyTitle === 'string'
        ? frontmatter.bibliographyTitle.trim()
        : undefined,
    content: parsed.content.trim(),
    directory: directory === '.' ? '' : directory,
    excerpt: typeof frontmatter.excerpt === 'string' ? frontmatter.excerpt.trim() : undefined,
    hasAttachmentsField: Object.prototype.hasOwnProperty.call(frontmatter, 'attachments'),
    hasBibliographyField: Object.prototype.hasOwnProperty.call(frontmatter, 'bibliography'),
    hasHeroImageField: Object.prototype.hasOwnProperty.call(frontmatter, 'heroImage'),
    hasLocaleField: Object.prototype.hasOwnProperty.call(frontmatter, 'locale'),
    hasTagsField: Object.prototype.hasOwnProperty.call(frontmatter, 'tags'),
    hasVisibilityField: Object.prototype.hasOwnProperty.call(frontmatter, 'visibility'),
    heroImagePath:
      typeof frontmatter.heroImage === 'string'
        ? frontmatter.heroImage.trim()
        : frontmatter.heroImage === null
          ? null
          : undefined,
    locale: localeValue,
    path: entry.path,
    slug: rawSlug,
    status: rawStatus === 'published' ? 'published' : 'draft',
    tags: parseTags(frontmatter.tags),
    title,
    translatedAt:
      typeof frontmatter.translatedAt === 'string' ? frontmatter.translatedAt.trim() : undefined,
    translatedFromLocale:
      normalizeLocale(
        typeof frontmatter.translatedFromLocale === 'string'
          ? frontmatter.translatedFromLocale
          : undefined,
      ) ?? undefined,
    translationProvider:
      typeof frontmatter.translationProvider === 'string'
        ? frontmatter.translationProvider.trim()
        : undefined,
    translationStatus: parseTranslationStatus(frontmatter.translationStatus),
    visibility: normalizePostVisibility(rawVisibility),
  }
}

function resolveBibliographySource(
  documents: ParsedMarkdownDocument[],
  entries: Map<string, ArchiveEntry>,
): ParsedBibliographySource | null {
  const sharedDocument =
    documents.find((document) => document.locale === defaultLocale) ?? documents[0]

  if (!sharedDocument) {
    return null
  }

  if (sharedDocument.hasBibliographyField && sharedDocument.bibliographyPath === null) {
    return null
  }

  if (sharedDocument.bibliographyPath) {
    const resolvedPath = resolvePackagePath(
      sharedDocument.directory,
      sharedDocument.bibliographyPath,
    )

    if (!resolvedPath) {
      throw new Error(`Invalid bibliography path "${sharedDocument.bibliographyPath}".`)
    }

    const bibliographyEntry = entries.get(resolvedPath)

    if (!bibliographyEntry?.text) {
      throw new Error(`Bibliography file "${resolvedPath}" was not found in the archive.`)
    }

    return {
      description: sharedDocument.bibliographyDescription,
      filename: path.posix.basename(resolvedPath),
      path: resolvedPath,
      source: bibliographyEntry.text,
      title: sharedDocument.bibliographyTitle || `${sharedDocument.title} References`,
    }
  }

  const bibliographyEntries = Array.from(entries.values()).filter((entry) =>
    bibliographyExtensionPattern.test(entry.path),
  )

  if (bibliographyEntries.length === 0) {
    return null
  }

  if (bibliographyEntries.length > 1) {
    throw new Error(
      'Archive contains multiple .bib files. Specify the bibliography path in the default locale markdown frontmatter.',
    )
  }

  const [bibliographyEntry] = bibliographyEntries

  return {
    description: sharedDocument.bibliographyDescription,
    filename: path.posix.basename(bibliographyEntry.path),
    path: bibliographyEntry.path,
    source: bibliographyEntry.text ?? '',
    title: sharedDocument.bibliographyTitle || `${sharedDocument.title} References`,
  }
}

function parseMDshipManifest(entries: Map<string, ArchiveEntry>): MDshipManifest | null {
  const manifestEntry = entries.get('manifest.json')

  if (!manifestEntry?.text) {
    return null
  }

  let parsedManifest: unknown

  try {
    parsedManifest = JSON.parse(manifestEntry.text)
  } catch {
    throw new Error('manifest.json is not valid JSON.')
  }

  if (!parsedManifest || typeof parsedManifest !== 'object') {
    throw new Error('manifest.json must contain a JSON object.')
  }

  const record = parsedManifest as Record<string, unknown>

  return {
    bibliography: record.bibliography as MDshipManifest['bibliography'],
    document: typeof record.document === 'string' ? record.document : undefined,
    warnings: parseStringArray(record.warnings),
  }
}

function applyMDshipOverrides(args: {
  bibliographyPath?: string | null
  document: ParsedMarkdownDocument
  overrides: ImportPostOverrides
}): ParsedMarkdownDocument {
  const { bibliographyPath, document, overrides } = args

  return {
    ...document,
    bibliographyPath: bibliographyPath ?? document.bibliographyPath,
    excerpt: overrides.excerpt?.trim() || document.excerpt,
    locale: overrides.locale ?? document.locale,
    slug: overrides.slug?.trim() || document.slug,
    status: overrides.status ?? document.status,
    tags: overrides.tags && overrides.tags.length > 0 ? overrides.tags : document.tags,
    title: overrides.title?.trim() || document.title,
    visibility: overrides.visibility ?? document.visibility,
    hasVisibilityField: Boolean(overrides.visibility) || document.hasVisibilityField,
  }
}

function parseMDshipPackage(args: {
  entries: ArchiveEntry[]
  entryMap: Map<string, ArchiveEntry>
  manifest: MDshipManifest
  overrides?: ImportPostOverrides
}): ParsedPostPackage {
  const { entries, entryMap, manifest } = args
  const overrides = args.overrides ?? {}
  const documentPath = normalizeArchivePath(manifest.document ?? '')

  if (!documentPath) {
    throw new Error('mdship manifest.json is missing a valid "document" path.')
  }

  const documentEntry = entryMap.get(documentPath)

  if (!documentEntry?.text) {
    throw new Error(`mdship document "${documentPath}" was not found in the uploaded workspace.`)
  }

  const manifestBibliographyPath = parseBibliographyPath(manifest.bibliography)
  const parsedDocument = parseMarkdownDocument(documentEntry)
  const document = applyMDshipOverrides({
    bibliographyPath: manifestBibliographyPath,
    document: parsedDocument,
    overrides,
  })
  const bibliography = resolveBibliographySource([document], entryMap)

  return {
    bibliography,
    createLocale: document.locale,
    defaultDocument: document.locale === defaultLocale ? document : null,
    documents: [document],
    entries: buildEntryMap(entries),
    slug: document.slug,
    sourceKind: 'mdship',
    warnings: manifest.warnings ?? [],
  }
}

function parsePostPackage(
  entries: ArchiveEntry[],
  overrides?: ImportPostOverrides,
): ParsedPostPackage {
  const entryMap = buildEntryMap(entries)
  const mdshipManifest = parseMDshipManifest(entryMap)

  if (mdshipManifest) {
    return parseMDshipPackage({
      entries,
      entryMap,
      manifest: mdshipManifest,
      overrides,
    })
  }

  const markdownEntries = entries.filter((entry) => markdownExtensionPattern.test(entry.path))

  if (markdownEntries.length === 0) {
    throw new Error('Archive does not contain any Markdown files.')
  }

  const parsedDocuments = markdownEntries.map(parseMarkdownDocument)
  const slugs = new Set(parsedDocuments.map((document) => document.slug))

  if (slugs.size !== 1) {
    throw new Error(
      'Archive must describe exactly one post slug. Split multi-post imports into separate packages.',
    )
  }

  const documents = parsedDocuments.map((document) => ({
    ...document,
    slug: overrides?.slug?.trim() || document.slug,
  }))
  const duplicateLocale = documents.find(
    (document, index) =>
      documents.findIndex((candidate) => candidate.locale === document.locale) !== index,
  )

  if (duplicateLocale) {
    throw new Error(
      `Archive contains more than one markdown file for locale "${duplicateLocale.locale}".`,
    )
  }

  const bibliography = resolveBibliographySource(documents, entryMap)
  const createLocale =
    documents.find((document) => document.locale === defaultLocale)?.locale ??
    documents[0]?.locale ??
    defaultLocale

  return {
    bibliography,
    createLocale,
    defaultDocument: documents.find((document) => document.locale === defaultLocale) ?? null,
    documents,
    entries: entryMap,
    slug: documents[0]?.slug ?? '',
    sourceKind: 'generic',
    warnings: [],
  }
}

function collectMarkdownAssetUsages(document: ParsedMarkdownDocument): AssetUsage[] {
  const usages: AssetUsage[] = []

  for (const match of document.content.matchAll(markdownAssetPattern)) {
    const prefix = match[1]
    const text = match[2]?.trim()
    const target = match[3]
    const resolvedPath = resolvePackagePath(document.directory, target)

    if (!resolvedPath) {
      continue
    }

    usages.push({
      alt: prefix === '!' ? text : undefined,
      kind: prefix === '!' ? 'image' : 'asset',
      sourcePath: resolvedPath,
    })
  }

  return usages
}

function fileNameToLabel(filePath: string): string {
  const raw = path.posix.basename(filePath, path.posix.extname(filePath))

  return raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildAssetUsageMap(parsedPackage: ParsedPostPackage): Map<string, AssetUsage> {
  const usageMap = new Map<string, AssetUsage>()

  for (const document of parsedPackage.documents) {
    if (document.heroImagePath) {
      const resolvedPath = resolvePackagePath(document.directory, document.heroImagePath)

      if (!resolvedPath) {
        throw new Error(`Invalid heroImage path "${document.heroImagePath}" in ${document.path}.`)
      }

      usageMap.set(resolvedPath, {
        kind: 'heroImage',
        sourcePath: resolvedPath,
      })
    }

    for (const attachment of document.attachments) {
      const resolvedPath = resolvePackagePath(document.directory, attachment.path)

      if (!resolvedPath) {
        throw new Error(`Invalid attachment path "${attachment.path}" in ${document.path}.`)
      }

      if (!usageMap.has(resolvedPath)) {
        usageMap.set(resolvedPath, {
          kind: 'attachment',
          sourcePath: resolvedPath,
        })
      }
    }

    for (const usage of collectMarkdownAssetUsages(document)) {
      const previous = usageMap.get(usage.sourcePath)

      usageMap.set(usage.sourcePath, {
        alt: previous?.alt || usage.alt,
        kind: previous?.kind === 'heroImage' ? previous.kind : usage.kind,
        sourcePath: usage.sourcePath,
      })
    }
  }

  return usageMap
}

function rewriteMarkdownAssetLinks(
  document: ParsedMarkdownDocument,
  uploadedMediaByPath: Map<string, Media>,
): string {
  return document.content.replace(
    markdownAssetPattern,
    (fullMatch, prefix: string, label: string, target: string, suffix = '') => {
      const resolvedPath = resolvePackagePath(document.directory, target)

      if (!resolvedPath) {
        return fullMatch
      }

      const uploadedMedia = uploadedMediaByPath.get(resolvedPath)

      if (!uploadedMedia?.url) {
        return fullMatch
      }

      return `${prefix}[${label}](${uploadedMedia.url}${suffix})`
    },
  )
}

function getSharedDocument(parsedPackage: ParsedPostPackage): ParsedMarkdownDocument {
  return parsedPackage.defaultDocument ?? parsedPackage.documents[0]
}

function buildLocalRequest(
  user: User,
  locale?: AppLocale,
): Partial<PayloadRequest> & {
  user: User
} {
  return locale
    ? {
        locale,
        user,
      }
    : {
        user,
      }
}

async function findOneByField(args: {
  collection: 'media'
  field: string
  payload: Payload
  user: User
  value: string
}): Promise<Media | null>
async function findOneByField(args: {
  collection: 'posts'
  field: string
  payload: Payload
  user: User
  value: string
}): Promise<Post | null>
async function findOneByField(args: {
  collection: 'media' | 'posts'
  field: string
  payload: Payload
  user: User
  value: string
}): Promise<Media | Post | null> {
  const result = await args.payload.find({
    collection: args.collection,
    depth: 0,
    limit: 1,
    overrideAccess: false,
    req: buildLocalRequest(args.user),
    user: args.user,
    where: {
      [args.field]: {
        equals: args.value,
      },
    },
  })

  return (result.docs[0] as Media | Post | undefined) ?? null
}

function getEmbeddedPostBibliography(post: Post | null): EmbeddedBibliography | null {
  if (!post) {
    return null
  }

  return getBibliographySource(
    (post as Post & { bibliography?: Record<string, unknown> | null }).bibliography ?? null,
  )
}

function buildEmbeddedBibliography(args: {
  bibliography: ParsedBibliographySource | null
  existingPost: Post | null
}): EmbeddedBibliography | null {
  if (!args.bibliography) {
    return getEmbeddedPostBibliography(args.existingPost)
  }

  return {
    description: args.bibliography.description,
    filename: args.bibliography.filename,
    source: args.bibliography.source,
    title: args.bibliography.title,
  }
}

function buildImportedAssetFilename(slug: string, assetPath: string): string {
  const extension = path.posix.extname(assetPath)
  const baseName = assetPath.slice(0, extension ? -extension.length : undefined)
  const normalizedBase = `${slug}-${baseName}`
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${normalizedBase || slug}${extension}`
}

async function writeTemporaryAsset(
  tempDir: string,
  entry: ArchiveEntry,
  fileNameOverride?: string,
): Promise<string> {
  const tempFilePath = fileNameOverride
    ? path.join(tempDir, 'normalized-assets', fileNameOverride)
    : path.join(tempDir, entry.path)

  await fs.mkdir(path.dirname(tempFilePath), {
    recursive: true,
  })
  await fs.writeFile(tempFilePath, entry.bytes)

  return tempFilePath
}

async function upsertMediaAssets(args: {
  ownerPostID?: PostDocumentID
  parsedPackage: ParsedPostPackage
  payload: Payload
  slug: string
  tempDir: string
  user: User
}): Promise<Map<string, Media>> {
  const usageMap = buildAssetUsageMap(args.parsedPackage)
  const uploadedMediaByPath = new Map<string, Media>()

  for (const [assetPath, usage] of usageMap.entries()) {
    const archiveEntry = args.parsedPackage.entries.get(assetPath)

    if (!archiveEntry) {
      throw new Error(
        `Asset "${assetPath}" referenced by the markdown was not found in the archive.`,
      )
    }

    const importKey = `${args.slug}:asset:${assetPath}`
    const existingMedia = await findOneByField({
      collection: 'media',
      field: 'importKey',
      payload: args.payload,
      user: args.user,
      value: importKey,
    })
    const tempFilePath = await writeTemporaryAsset(
      args.tempDir,
      archiveEntry,
      buildImportedAssetFilename(args.slug, assetPath),
    )
    const alt = usage.alt || fileNameToLabel(assetPath) || path.posix.basename(assetPath)
    const data: Pick<Media, 'alt' | 'importKey'> & {
      ownerPost?: PostDocumentID
    } = {
      alt,
      importKey,
      ...(args.ownerPostID !== undefined ? { ownerPost: args.ownerPostID } : {}),
    }

    const media = existingMedia
      ? ((await args.payload.update({
          collection: 'media',
          data,
          filePath: tempFilePath,
          id: existingMedia.id,
          overrideAccess: false,
          overwriteExistingFiles: true,
          req: buildLocalRequest(args.user),
          user: args.user,
        })) as unknown as Media)
      : ((await args.payload.create({
          collection: 'media',
          data,
          filePath: tempFilePath,
          overrideAccess: false,
          req: buildLocalRequest(args.user),
          user: args.user,
        })) as Media)

    uploadedMediaByPath.set(assetPath, media)
  }

  return uploadedMediaByPath
}

async function assignOwnedResourcesToPost(args: {
  payload: Payload
  postID: PostDocumentID
  uploadedMediaByPath: Map<string, Media>
  user: User
}): Promise<{
  uploadedMediaByPath: Map<string, Media>
}> {
  const request = buildLocalRequest(args.user)
  const ownedMediaByPath = new Map<string, Media>()

  for (const [assetPath, media] of args.uploadedMediaByPath.entries()) {
    const ownedMedia = (await args.payload.update({
      collection: 'media',
      data: {
        ownerPost: args.postID,
      },
      id: media.id,
      overrideAccess: false,
      req: request,
      user: args.user,
    })) as unknown as Media

    ownedMediaByPath.set(assetPath, ownedMedia)
  }

  return {
    uploadedMediaByPath: ownedMediaByPath,
  }
}

function buildAttachmentData(
  sharedDocument: ParsedMarkdownDocument,
  uploadedMediaByPath: Map<string, Media>,
): Array<{
  description?: string
  file: number
  label?: string
}> {
  return sharedDocument.attachments
    .map((attachment) => {
      const resolvedPath = resolvePackagePath(sharedDocument.directory, attachment.path)

      if (!resolvedPath) {
        throw new Error(`Invalid attachment path "${attachment.path}" in ${sharedDocument.path}.`)
      }

      const media = uploadedMediaByPath.get(resolvedPath)

      if (!media?.id) {
        throw new Error(`Attachment asset "${resolvedPath}" could not be uploaded.`)
      }

      return {
        description: attachment.description,
        file: media.id,
        label: attachment.label || fileNameToLabel(resolvedPath),
      }
    })
    .filter(Boolean)
}

async function findPostBySlug(payload: Payload, slug: string, user: User): Promise<Post | null> {
  return findOneByField({
    collection: 'posts',
    field: 'slug',
    payload,
    user,
    value: slug,
  })
}

function buildLocalizedPostData(document: ParsedMarkdownDocument, content: string) {
  return {
    content,
    excerpt: document.excerpt,
    title: document.title,
    translatedAt: document.translatedAt,
    translatedFromLocale: document.translatedFromLocale,
    translationProvider: document.translationProvider,
    translationStatus: document.translationStatus,
  }
}

export async function importPostPackage(args: {
  file: File
  overrides?: ImportPostOverrides
  payload: Payload
  user: User
}): Promise<ImportPostPackageResult> {
  const archiveEntries = await readArchiveEntries(args.file)
  const parsedPackage = parsePostPackage(archiveEntries, args.overrides)
  return importPostEntries({
    parsedPackage,
    payload: args.payload,
    user: args.user,
  })
}

export async function importPostWorkspace(args: {
  files: ImportedWorkspaceFile[]
  overrides?: ImportPostOverrides
  payload: Payload
  user: User
}): Promise<ImportPostPackageResult> {
  const workspaceEntries = await readWorkspaceEntries(args.files)
  const parsedPackage = parsePostPackage(workspaceEntries, args.overrides)
  return importPostEntries({
    parsedPackage,
    payload: args.payload,
    user: args.user,
  })
}

async function importPostEntries(args: {
  parsedPackage: ParsedPostPackage
  payload: Payload
  user: User
}): Promise<ImportPostPackageResult> {
  const { parsedPackage } = args
  const sharedDocument = getSharedDocument(parsedPackage)
  const existingPost = await findPostBySlug(args.payload, parsedPackage.slug, args.user)

  const bibliography =
    parsedPackage.bibliography ??
    (parsedPackage.documents.some((document) => extractCitationKeys(document.content).length > 0)
      ? null
      : null)

  const existingBibliography = getEmbeddedPostBibliography(existingPost)

  if (!bibliography && !existingBibliography?.source) {
    const citationDocument = parsedPackage.documents.find(
      (document) => extractCitationKeys(document.content).length > 0,
    )

    if (citationDocument) {
      throw new Error(
        `Markdown file "${citationDocument.path}" contains citation keys, but the package does not provide a bibliography.`,
      )
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zblog-post-package-'))

  try {
    const bibliographyDocument = buildEmbeddedBibliography({
      bibliography,
      existingPost,
    })
    let uploadedMediaByPath = await upsertMediaAssets({
      ownerPostID: existingPost?.id,
      parsedPackage,
      payload: args.payload,
      slug: parsedPackage.slug,
      tempDir,
      user: args.user,
    })

    const heroImagePath =
      sharedDocument.heroImagePath !== undefined && sharedDocument.heroImagePath !== null
        ? resolvePackagePath(sharedDocument.directory, sharedDocument.heroImagePath)
        : null
    const heroImage = heroImagePath ? uploadedMediaByPath.get(heroImagePath) : null
    const sharedData: Record<string, unknown> = {
      _status: sharedDocument.status,
      slug: parsedPackage.slug,
    }

    if (sharedDocument.hasVisibilityField) {
      sharedData.visibility = sharedDocument.visibility
    }

    if (sharedDocument.hasTagsField) {
      sharedData.tags = sharedDocument.tags.map((value) => ({
        value,
      }))
    }

    if (sharedDocument.hasHeroImageField) {
      sharedData.heroImage = sharedDocument.heroImagePath === null ? null : (heroImage?.id ?? null)
    }

    if (sharedDocument.hasAttachmentsField) {
      sharedData.attachments = buildAttachmentData(sharedDocument, uploadedMediaByPath)
    }

    if (
      bibliographyDocument ||
      (sharedDocument.hasBibliographyField && sharedDocument.bibliographyPath === null)
    ) {
      sharedData.bibliography =
        sharedDocument.hasBibliographyField && sharedDocument.bibliographyPath === null
          ? null
          : {
              filename: bibliographyDocument?.filename ?? null,
              source: bibliographyDocument?.source ?? null,
            }
    }

    const effectiveStatus = sharedDocument.status
    const localizedDocuments = parsedPackage.documents.map((document) => ({
      data: buildLocalizedPostData(
        document,
        rewriteMarkdownAssetLinks(document, uploadedMediaByPath),
      ),
      locale: document.locale,
    }))
    const createDocument =
      localizedDocuments.find((document) => document.locale === parsedPackage.createLocale) ??
      localizedDocuments[0]
    let post: Post

    if (!existingPost) {
      if (!createDocument) {
        throw new Error('No localized document content was found in the uploaded workspace.')
      }

      post = (await args.payload.create({
        collection: 'posts',
        data: {
          ...sharedData,
          ...createDocument.data,
        },
        draft: sharedDocument.status !== 'published',
        locale: createDocument.locale,
        overrideAccess: false,
        req: buildLocalRequest(args.user, createDocument.locale),
        user: args.user,
      } as any)) as Post
    } else {
      post = existingPost

      if (parsedPackage.defaultDocument) {
        post = (await args.payload.update({
          collection: 'posts',
          data: {
            ...sharedData,
            ...buildLocalizedPostData(
              parsedPackage.defaultDocument,
              rewriteMarkdownAssetLinks(parsedPackage.defaultDocument, uploadedMediaByPath),
            ),
          },
          draft: effectiveStatus !== 'published',
          id: existingPost.id,
          locale: defaultLocale,
          overrideAccess: false,
          req: buildLocalRequest(args.user, defaultLocale),
          user: args.user,
        })) as Post
      } else if (Object.keys(sharedData).length > 1) {
        post = (await args.payload.update({
          collection: 'posts',
          data: sharedData,
          draft: effectiveStatus !== 'published',
          id: existingPost.id,
          locale: defaultLocale,
          overrideAccess: false,
          req: buildLocalRequest(args.user, defaultLocale),
          user: args.user,
        })) as Post
      }
    }

    ;({ uploadedMediaByPath } = await assignOwnedResourcesToPost({
      payload: args.payload,
      postID: post.id,
      uploadedMediaByPath,
      user: args.user,
    }))

    for (const document of localizedDocuments) {
      if (!existingPost && document.locale === createDocument?.locale) {
        continue
      }

      await args.payload.update({
        collection: 'posts',
        data: document.data,
        draft: effectiveStatus !== 'published',
        id: post.id,
        locale: document.locale,
        overrideAccess: false,
        req: buildLocalRequest(args.user, document.locale),
        user: args.user,
      })
    }

    return {
      bibliographyID: null,
      importedLocales: localizedDocuments.map((document) => document.locale),
      importedMediaCount: uploadedMediaByPath.size,
      operation: existingPost ? 'updated' : 'created',
      postID: post.id,
      slug: parsedPackage.slug,
      sourceKind: parsedPackage.sourceKind,
      warnings: parsedPackage.warnings,
    }
  } finally {
    await fs.rm(tempDir, {
      force: true,
      recursive: true,
    })
  }
}
