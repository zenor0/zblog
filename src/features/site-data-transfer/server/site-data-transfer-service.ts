import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { Payload, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

import {
  assertValidSiteDataExportManifest,
  createEmptyGroupDiff,
  createSiteDataTransferDiffSummary,
  getPresetGroups,
  normalizeArchiveEntryPath,
  normalizeDataTransferGroups,
  siteDataExportManifestKind,
  siteDataExportManifestVersion,
  siteDataTransferGroupIDs,
  type SiteDataExportManifest,
  type SiteDataExportPresetID,
  type SiteDataTransferDiff,
  type SiteDataTransferGroupDiff,
  type SiteDataTransferGroupID,
} from '@/features/site-data-transfer/model/site-data-transfer'
import { getPostViewMetricKey } from '@/features/post-views/server/post-views'
import { resolveLocalMediaFilePath } from '@/features/media/server/media-server'
import { defaultLocale, localeCodes, type AppLocale } from '@/shared/i18n/locales'
import { siteDataExportDir, siteDataImportDir } from '@/shared/runtime/paths'

const archiveManifestPath = 'manifest.json'
const archiveDataPath = 'data/site-data.json'
const maxImportArchiveBytes = 250 * 1024 * 1024
const maxImportEntryCount = 5000
const exportFilePattern = /^zblog-export-[a-zA-Z0-9._-]+\.zip$/
const importTokenPattern = /^[a-f0-9-]{36}$/i
const transferContext = {
  siteDataTransfer: true,
}

type JsonRecord = Record<string, unknown>

type ExportedMediaRecord = JsonRecord & {
  archivePath?: string
  checksum?: string
  filename?: string
  importKey?: string
  sourceID: number | string
}

type ExportedPostRecord = JsonRecord & {
  slug?: string
  sourceID: number | string
}

type ExportedPostVersionRecord = JsonRecord & {
  parentSlug?: string
  parentSourceID?: number | string
  sourceID?: number | string
  version?: JsonRecord
}

type ExportedPostMetricRecord = JsonRecord & {
  locale?: AppLocale
  postSlug?: string
  postSourceID?: number | string
}

type SiteDataArchiveData = {
  collections?: {
    media?: ExportedMediaRecord[]
    postViewMetrics?: ExportedPostMetricRecord[]
    posts?: ExportedPostRecord[]
  }
  globals?: {
    frontendVariants?: JsonRecord
    siteSettings?: JsonRecord
  }
  versions?: {
    posts?: ExportedPostVersionRecord[]
  }
}

type ParsedArchive = {
  data: SiteDataArchiveData
  entries: Record<string, Uint8Array>
  manifest: SiteDataExportManifest
}

export type SiteDataExportFile = {
  createdAt: string
  downloadURL: string
  id: string
  manifest: SiteDataExportManifest
  size: number
}

export type CreateSiteDataExportResult = {
  file: SiteDataExportFile
  manifest: SiteDataExportManifest
}

export type SiteDataImportPreview = {
  diff: SiteDataTransferDiff
  manifest: SiteDataExportManifest
  summary: ReturnType<typeof createSiteDataTransferDiffSummary>
  token: string
}

export type SiteDataImportCommitResult = {
  appliedGroups: SiteDataTransferGroupID[]
  diff: SiteDataTransferDiff
  manifest: SiteDataExportManifest
  summary: ReturnType<typeof createSiteDataTransferDiffSummary>
}

type RelationshipMaps = {
  media: Map<string, number | string>
  posts: Map<string, number | string>
}

type PostLookup = {
  bySourceID: Map<string, ExportedPostRecord>
  slugBySourceID: Map<string, string>
}

function buildLocalRequest(
  user: User,
  locale?: AppLocale,
): Partial<PayloadRequest> & { user: User } {
  return {
    ...(locale ? { locale } : {}),
    context: transferContext,
    user,
  } as Partial<PayloadRequest> & { user: User }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneWithoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneWithoutUndefined(item)) as T
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, cloneWithoutUndefined(item)]),
    ) as T
  }

  return value
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function hashValue(value: unknown): string {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex')
}

function hashBuffer(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

function normalizeZipEntries(entries: Record<string, Uint8Array>): Record<string, Uint8Array> {
  return Object.fromEntries(
    Object.entries(entries).map(([entryPath, bytes]) => [entryPath, new Uint8Array(bytes)]),
  )
}

function stripSystemFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripSystemFields(item))
  }

  if (!isRecord(value)) {
    return value
  }

  const ignored = new Set([
    'createdAt',
    'height',
    'id',
    'mimeType',
    'previewSVGError',
    'previewSVGFilename',
    'previewSVGGeneratedAt',
    'previewSVGStatus',
    'previewSVGURL',
    'sizes',
    'thumbnailURL',
    'updatedAt',
    'url',
    'width',
  ])

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !ignored.has(key))
      .map(([key, item]) => [key, stripSystemFields(item)]),
  )
}

function getID(value: unknown): null | string {
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value)
  }

  if (isRecord(value)) {
    const id = value.id

    if (typeof id === 'number' || typeof id === 'string') {
      return String(id)
    }
  }

  return null
}

function getRelationID(value: unknown): number | string | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (isRecord(value)) {
    const id = value.id

    if (typeof id === 'number' || typeof id === 'string') {
      return id
    }
  }

  return undefined
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeStatus(value: unknown): 'draft' | 'published' {
  return value === 'published' ? 'published' : 'draft'
}

function getLocaleValue(value: unknown, locale: AppLocale): unknown {
  if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, locale)) {
    return value[locale]
  }

  return value
}

function isUsableLocalePostData(data: JsonRecord): boolean {
  return getString(data.title) !== undefined && getString(data.content) !== undefined
}

function safeExportFilename(filename: string): boolean {
  return exportFilePattern.test(filename) && path.basename(filename) === filename
}

function resolveExportFilePath(filename: string): string | null {
  if (!safeExportFilename(filename)) {
    return null
  }

  return path.resolve(siteDataExportDir, filename)
}

function getExportSidecarPath(filename: string): string | null {
  const exportPath = resolveExportFilePath(filename)

  if (!exportPath) {
    return null
  }

  return exportPath.replace(/\.zip$/i, '.json')
}

function getImportFilePath(token: string): string | null {
  if (!importTokenPattern.test(token)) {
    return null
  }

  return path.resolve(siteDataImportDir, `${token}.zip`)
}

async function findAll<TDoc = JsonRecord>(
  payload: Payload,
  options: Record<string, unknown>,
): Promise<TDoc[]> {
  const docs: TDoc[] = []
  let page = 1

  while (true) {
    const result = await payload.find({
      ...options,
      limit: 100,
      page,
    } as never)

    docs.push(...((result.docs ?? []) as TDoc[]))

    if (!result.hasNextPage) {
      return docs
    }

    page += 1
  }
}

async function findAllVersions<TDoc = JsonRecord>(
  payload: Payload,
  options: Record<string, unknown>,
): Promise<TDoc[]> {
  const docs: TDoc[] = []
  let page = 1

  while (true) {
    const result = await payload.findVersions({
      ...options,
      limit: 100,
      page,
    } as never)

    docs.push(...((result.docs ?? []) as TDoc[]))

    if (!result.hasNextPage) {
      return docs
    }

    page += 1
  }
}

async function findOneByField(args: {
  collection: 'media' | 'post-view-metrics' | 'posts'
  field: string
  payload: Payload
  user: User
  value: number | string
}): Promise<JsonRecord | null> {
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
  } as never)

  return (result.docs[0] as unknown as JsonRecord | undefined) ?? null
}

async function findPostBySlug(payload: Payload, user: User, slug: string) {
  return findOneByField({
    collection: 'posts',
    field: 'slug',
    payload,
    user,
    value: slug,
  })
}

async function findMediaMatch(
  payload: Payload,
  user: User,
  media: ExportedMediaRecord,
): Promise<JsonRecord | null> {
  if (media.importKey) {
    const byImportKey = await findOneByField({
      collection: 'media',
      field: 'importKey',
      payload,
      user,
      value: media.importKey,
    })

    if (byImportKey) {
      return byImportKey
    }
  }

  if (media.filename) {
    return findOneByField({
      collection: 'media',
      field: 'filename',
      payload,
      user,
      value: media.filename,
    })
  }

  return null
}

async function findPostVersionHashes(payload: Payload, user: User, postID: number | string) {
  const versions = await findAllVersions<JsonRecord>(payload, {
    collection: 'posts',
    depth: 0,
    fallbackLocale: false,
    locale: 'all',
    overrideAccess: false,
    req: buildLocalRequest(user),
    sort: '-updatedAt',
    user,
    where: {
      parent: {
        equals: postID,
      },
    },
  })

  return new Set(
    versions.map((version) =>
      hashValue({
        autosave: version.autosave,
        publishedLocale: version.publishedLocale,
        version: stripSystemFields(version.version),
      }),
    ),
  )
}

function buildPostLookup(posts: ExportedPostRecord[] | undefined): PostLookup {
  const bySourceID = new Map<string, ExportedPostRecord>()
  const slugBySourceID = new Map<string, string>()

  ;(posts ?? []).forEach((post) => {
    bySourceID.set(String(post.sourceID), post)

    if (typeof post.slug === 'string' && post.slug.trim()) {
      slugBySourceID.set(String(post.sourceID), post.slug)
    }
  })

  return {
    bySourceID,
    slugBySourceID,
  }
}

function rewriteRelationships(value: unknown, maps: RelationshipMaps): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteRelationships(item, maps))
  }

  if (!isRecord(value)) {
    return value
  }

  const mediaKeys = new Set([
    'avatar',
    'defaultSocialImage',
    'file',
    'heroImage',
    'icon',
    'logo',
    'metaImage',
  ])
  const postKeys = new Set(['ownerPost', 'post'])

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      const id = getID(item)

      if (id && mediaKeys.has(key)) {
        return [key, maps.media.get(id) ?? item]
      }

      if (id && postKeys.has(key)) {
        return [key, maps.posts.get(id) ?? item]
      }

      return [key, rewriteRelationships(item, maps)]
    }),
  )
}

function buildMediaData(media: ExportedMediaRecord, maps: RelationshipMaps): JsonRecord {
  const ownerPost = rewriteRelationships({ ownerPost: media.ownerPost }, maps) as JsonRecord

  return cloneWithoutUndefined({
    alt: getString(media.alt) ?? getString(media.filename) ?? 'Imported media',
    caption: media.caption ?? undefined,
    credit: media.credit ?? undefined,
    importKey:
      getString(media.importKey) ??
      `site-transfer:${getString(media.sourceExportID) ?? 'unknown'}:media:${String(
        media.sourceID,
      )}`,
    ownerPost: getRelationID(ownerPost.ownerPost),
  })
}

function buildSharedPostData(post: ExportedPostRecord, maps: RelationshipMaps): JsonRecord {
  const rewritten = rewriteRelationships(post, maps) as JsonRecord
  const seo = isRecord(rewritten.seo) ? rewritten.seo : undefined

  return cloneWithoutUndefined({
    _status: normalizeStatus(rewritten._status),
    attachments: rewritten.attachments,
    bibliography: rewritten.bibliography,
    heroImage: getRelationID(rewritten.heroImage),
    publishedAt: rewritten.publishedAt,
    seo: seo
      ? {
          metaImage: getRelationID(seo.metaImage),
        }
      : undefined,
    slug: rewritten.slug,
    tags: rewritten.tags,
  })
}

function buildPostLocaleData(post: ExportedPostRecord, locale: AppLocale): JsonRecord {
  const seo = isRecord(post.seo) ? post.seo : {}

  return cloneWithoutUndefined({
    content: getLocaleValue(post.content, locale),
    excerpt: getLocaleValue(post.excerpt, locale),
    seo: {
      metaDescription: getLocaleValue(seo.metaDescription, locale),
      metaTitle: getLocaleValue(seo.metaTitle, locale),
      noindex: getLocaleValue(seo.noindex, locale),
    },
    title: getLocaleValue(post.title, locale),
    translatedAt: getLocaleValue(post.translatedAt, locale),
    translatedFromLocale: getLocaleValue(post.translatedFromLocale, locale),
    translationProvider: getLocaleValue(post.translationProvider, locale),
    translationStatus: getLocaleValue(post.translationStatus, locale),
  })
}

function getCreateLocale(post: ExportedPostRecord): AppLocale {
  const defaultData = buildPostLocaleData(post, defaultLocale)

  if (isUsableLocalePostData(defaultData)) {
    return defaultLocale
  }

  return (
    localeCodes.find((locale) => isUsableLocalePostData(buildPostLocaleData(post, locale))) ??
    defaultLocale
  )
}

function getPostComparableData(post: ExportedPostRecord): unknown {
  return stripSystemFields({
    ...buildSharedPostData(post, {
      media: new Map(),
      posts: new Map(),
    }),
    ...Object.fromEntries(localeCodes.map((locale) => [locale, buildPostLocaleData(post, locale)])),
  })
}

async function collectMediaExport(args: {
  archiveEntries: Record<string, Uint8Array>
  payload: Payload
  user: User
  warnings: string[]
}): Promise<ExportedMediaRecord[]> {
  const mediaDocs = await findAll<JsonRecord>(args.payload, {
    collection: 'media',
    depth: 0,
    overrideAccess: false,
    req: buildLocalRequest(args.user),
    sort: 'id',
    user: args.user,
  })

  const exported: ExportedMediaRecord[] = []

  for (const media of mediaDocs) {
    const filename = getString(media.filename)
    let archivePath: string | undefined
    let checksum: string | undefined

    if (filename) {
      const localPath = resolveLocalMediaFilePath(filename)
      const candidateArchivePath = normalizeArchiveEntryPath(`media/${filename}`)

      if (!candidateArchivePath) {
        args.warnings.push(`Skipped unsafe media filename "${filename}".`)
      } else if (localPath) {
        try {
          const bytes = await fs.readFile(localPath)

          archivePath = candidateArchivePath
          checksum = hashBuffer(bytes)
          args.archiveEntries[archivePath] = new Uint8Array(bytes)
        } catch {
          args.warnings.push(`Media file "${filename}" was not found on disk.`)
        }
      }
    }

    exported.push(
      cloneWithoutUndefined({
        alt: media.alt,
        archivePath,
        caption: media.caption,
        checksum,
        credit: media.credit,
        filename,
        filesize: media.filesize,
        height: media.height,
        importKey: getString(media.importKey),
        mimeType: media.mimeType,
        ownerPost: getRelationID(media.ownerPost),
        sourceID: media.id as number | string,
        width: media.width,
      }),
    )
  }

  return exported
}

async function collectPostsExport(payload: Payload, user: User): Promise<ExportedPostRecord[]> {
  const posts = await findAll<JsonRecord>(payload, {
    collection: 'posts',
    depth: 0,
    draft: true,
    fallbackLocale: false,
    locale: 'all',
    overrideAccess: false,
    req: buildLocalRequest(user),
    sort: 'slug',
    user,
  })

  return posts.map((post) => ({
    ...post,
    sourceID: post.id as number | string,
  })) as ExportedPostRecord[]
}

async function collectPostVersionsExport(args: {
  payload: Payload
  posts: ExportedPostRecord[]
  user: User
}): Promise<ExportedPostVersionRecord[]> {
  const lookup = buildPostLookup(args.posts)
  const versions: ExportedPostVersionRecord[] = []

  for (const post of args.posts) {
    const postID = post.sourceID
    const postVersions = await findAllVersions<JsonRecord>(args.payload, {
      collection: 'posts',
      depth: 0,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: false,
      req: buildLocalRequest(args.user),
      sort: 'createdAt',
      user: args.user,
      where: {
        parent: {
          equals: postID,
        },
      },
    })

    postVersions.forEach((version) => {
      versions.push({
        ...version,
        parentSlug: lookup.slugBySourceID.get(String(postID)),
        parentSourceID: postID,
        sourceID: version.id as number | string,
      } as ExportedPostVersionRecord)
    })
  }

  return versions
}

async function collectPostMetricsExport(args: {
  payload: Payload
  posts: ExportedPostRecord[]
  user: User
}): Promise<ExportedPostMetricRecord[]> {
  const lookup = buildPostLookup(args.posts)
  const metrics = await findAll<JsonRecord>(args.payload, {
    collection: 'post-view-metrics',
    depth: 0,
    overrideAccess: false,
    req: buildLocalRequest(args.user),
    sort: 'metricKey',
    user: args.user,
  })

  return metrics.map((metric) => {
    const postID = getRelationID(metric.post)

    return {
      ...metric,
      postSlug: postID === undefined ? undefined : lookup.slugBySourceID.get(String(postID)),
      postSourceID: postID,
    } as ExportedPostMetricRecord
  })
}

async function buildArchiveData(args: {
  archiveEntries: Record<string, Uint8Array>
  groups: SiteDataTransferGroupID[]
  payload: Payload
  user: User
  warnings: string[]
}): Promise<SiteDataArchiveData> {
  const data: SiteDataArchiveData = {}
  let exportedPosts: ExportedPostRecord[] | null = null

  if (args.groups.includes('site-settings')) {
    data.globals ??= {}
    data.globals.siteSettings = (await args.payload.findGlobal({
      depth: 0,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: false,
      req: buildLocalRequest(args.user),
      slug: 'site-settings',
      user: args.user,
    } as never)) as unknown as JsonRecord
  }

  if (args.groups.includes('frontend-variants')) {
    data.globals ??= {}
    data.globals.frontendVariants = (await args.payload.findGlobal({
      depth: 0,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: false,
      req: buildLocalRequest(args.user),
      slug: 'frontend-variants',
      user: args.user,
    } as never)) as unknown as JsonRecord
  }

  if (
    args.groups.includes('posts') ||
    args.groups.includes('post-versions') ||
    args.groups.includes('post-view-metrics')
  ) {
    exportedPosts = await collectPostsExport(args.payload, args.user)

    if (args.groups.includes('posts')) {
      data.collections ??= {}
      data.collections.posts = exportedPosts
    }
  }

  if (args.groups.includes('media')) {
    data.collections ??= {}
    data.collections.media = await collectMediaExport({
      archiveEntries: args.archiveEntries,
      payload: args.payload,
      user: args.user,
      warnings: args.warnings,
    })
  }

  if (args.groups.includes('post-versions')) {
    data.versions ??= {}
    data.versions.posts = await collectPostVersionsExport({
      payload: args.payload,
      posts: exportedPosts ?? [],
      user: args.user,
    })
  }

  if (args.groups.includes('post-view-metrics')) {
    data.collections ??= {}
    data.collections.postViewMetrics = await collectPostMetricsExport({
      payload: args.payload,
      posts: exportedPosts ?? [],
      user: args.user,
    })
  }

  return data
}

function createExportID(now = new Date()) {
  return `zblog-export-${now.toISOString().replace(/[:.]/g, '-').replace(/Z$/, 'z')}-${crypto
    .randomBytes(4)
    .toString('hex')}`
}

function countGroupRecords(data: SiteDataArchiveData, group: SiteDataTransferGroupID): number {
  if (group === 'site-settings') {
    return data.globals?.siteSettings ? 1 : 0
  }

  if (group === 'frontend-variants') {
    return data.globals?.frontendVariants ? 1 : 0
  }

  if (group === 'posts') {
    return data.collections?.posts?.length ?? 0
  }

  if (group === 'media') {
    return data.collections?.media?.length ?? 0
  }

  if (group === 'post-versions') {
    return data.versions?.posts?.length ?? 0
  }

  return data.collections?.postViewMetrics?.length ?? 0
}

export async function createSiteDataExport(args: {
  groups?: unknown
  payload: Payload
  preset?: SiteDataExportPresetID | string
  user: User
}): Promise<CreateSiteDataExportResult> {
  await fs.mkdir(siteDataExportDir, {
    recursive: true,
  })

  const groups = normalizeDataTransferGroups(args.groups)
  const selectedGroups = groups.length > 0 ? groups : getPresetGroups(args.preset)
  const warnings: string[] = []
  const archiveEntries: Record<string, Uint8Array> = {}
  const data = await buildArchiveData({
    archiveEntries,
    groups: selectedGroups,
    payload: args.payload,
    user: args.user,
    warnings,
  })
  const exportedAt = new Date().toISOString()
  const exportID = createExportID(new Date(exportedAt))
  const manifest: SiteDataExportManifest = {
    counts: Object.fromEntries(
      selectedGroups.map((group) => [group, countGroupRecords(data, group)]),
    ) as SiteDataExportManifest['counts'],
    exportedAt,
    exportID,
    groups: selectedGroups,
    kind: siteDataExportManifestKind,
    version: siteDataExportManifestVersion,
  }
  const filename = `${exportID}.zip`
  const filePath = resolveExportFilePath(filename)
  const sidecarPath = getExportSidecarPath(filename)

  if (!filePath || !sidecarPath) {
    throw new Error('Could not resolve the export file path.')
  }

  archiveEntries[archiveManifestPath] = strToU8(JSON.stringify(manifest, null, 2))
  archiveEntries[archiveDataPath] = strToU8(
    JSON.stringify(
      {
        ...data,
        warnings,
      },
      null,
      2,
    ),
  )

  const bytes = Buffer.from(zipSync(normalizeZipEntries(archiveEntries), { level: 6 }))

  await fs.writeFile(filePath, bytes)
  await fs.writeFile(
    sidecarPath,
    JSON.stringify(
      {
        createdAt: exportedAt,
        filename,
        manifest,
        size: bytes.byteLength,
      },
      null,
      2,
    ),
  )

  return {
    file: {
      createdAt: exportedAt,
      downloadURL: `/api/site-data-transfer/exports/${encodeURIComponent(filename)}`,
      id: filename,
      manifest,
      size: bytes.byteLength,
    },
    manifest,
  }
}

export async function listSiteDataExports(): Promise<SiteDataExportFile[]> {
  await fs.mkdir(siteDataExportDir, {
    recursive: true,
  })

  const entries = await fs.readdir(siteDataExportDir, {
    withFileTypes: true,
  })
  const files: SiteDataExportFile[] = []

  for (const entry of entries) {
    if (!entry.isFile() || !safeExportFilename(entry.name)) {
      continue
    }

    const filePath = resolveExportFilePath(entry.name)

    if (!filePath) {
      continue
    }

    const sidecarPath = getExportSidecarPath(entry.name)
    const stat = await fs.stat(filePath)
    let manifest: SiteDataExportManifest | null = null
    let createdAt = stat.mtime.toISOString()

    if (sidecarPath) {
      try {
        const sidecar = JSON.parse(await fs.readFile(sidecarPath, 'utf8')) as JsonRecord

        assertValidSiteDataExportManifest(sidecar.manifest)
        manifest = sidecar.manifest
        createdAt = getString(sidecar.createdAt) ?? createdAt
      } catch {
        manifest = null
      }
    }

    if (!manifest) {
      continue
    }

    files.push({
      createdAt,
      downloadURL: `/api/site-data-transfer/exports/${encodeURIComponent(entry.name)}`,
      id: entry.name,
      manifest,
      size: stat.size,
    })
  }

  return files.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function getSiteDataExportFile(filename: string) {
  const filePath = resolveExportFilePath(filename)

  if (!filePath) {
    return null
  }

  try {
    const bytes = await fs.readFile(filePath)

    return {
      bytes,
      filename,
    }
  } catch {
    return null
  }
}

export async function deleteSiteDataExportFile(filename: string): Promise<boolean> {
  const filePath = resolveExportFilePath(filename)
  const sidecarPath = getExportSidecarPath(filename)

  if (!filePath) {
    return false
  }

  await fs.rm(filePath, {
    force: true,
  })

  if (sidecarPath) {
    await fs.rm(sidecarPath, {
      force: true,
    })
  }

  return true
}

function parseArchiveBytes(bytes: Uint8Array): ParsedArchive {
  if (bytes.byteLength > maxImportArchiveBytes) {
    throw new Error('Import archive is too large.')
  }

  const rawEntries = unzipSync(bytes)
  const entries: Record<string, Uint8Array> = {}

  for (const [rawPath, contents] of Object.entries(rawEntries)) {
    const normalizedPath = normalizeArchiveEntryPath(rawPath)

    if (!normalizedPath) {
      throw new Error(`Import archive contains an unsafe path: ${rawPath}.`)
    }

    entries[normalizedPath] = contents
  }

  if (Object.keys(entries).length > maxImportEntryCount) {
    throw new Error('Import archive contains too many files.')
  }

  const manifestEntry = entries[archiveManifestPath]
  const dataEntry = entries[archiveDataPath]

  if (!manifestEntry || !dataEntry) {
    throw new Error('Import archive must contain manifest.json and data/site-data.json.')
  }

  const manifest = JSON.parse(strFromU8(manifestEntry)) as unknown

  assertValidSiteDataExportManifest(manifest)

  const data = JSON.parse(strFromU8(dataEntry)) as SiteDataArchiveData

  if (!isRecord(data)) {
    throw new Error('Import archive data must be an object.')
  }

  return {
    data,
    entries,
    manifest,
  }
}

async function readImportFile(token: string): Promise<ParsedArchive> {
  const filePath = getImportFilePath(token)

  if (!filePath) {
    throw new Error('Invalid import token.')
  }

  const bytes = await fs.readFile(filePath)

  return parseArchiveBytes(new Uint8Array(bytes))
}

async function writeImportPreviewFile(bytes: Uint8Array): Promise<string> {
  await fs.mkdir(siteDataImportDir, {
    recursive: true,
  })

  const token = crypto.randomUUID()
  const filePath = getImportFilePath(token)

  if (!filePath) {
    throw new Error('Could not create import token.')
  }

  await fs.writeFile(filePath, Buffer.from(bytes))

  return token
}

async function previewGlobalDiff(args: {
  current: unknown
  exported: unknown
  diff: SiteDataTransferGroupDiff
}) {
  if (!args.exported) {
    args.diff.skips += 1
    return
  }

  if (hashValue(stripSystemFields(args.current)) === hashValue(stripSystemFields(args.exported))) {
    args.diff.skips += 1
    return
  }

  args.diff.updates += 1
}

async function createImportDiff(args: {
  archive: ParsedArchive
  payload: Payload
  user: User
}): Promise<SiteDataTransferDiff> {
  const diff: SiteDataTransferDiff = {
    groups: {},
  }
  const data = args.archive.data

  for (const group of args.archive.manifest.groups) {
    diff.groups[group] = createEmptyGroupDiff()
  }

  if (diff.groups['site-settings']) {
    const current = await args.payload.findGlobal({
      depth: 0,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: false,
      req: buildLocalRequest(args.user),
      slug: 'site-settings',
      user: args.user,
    } as never)

    await previewGlobalDiff({
      current,
      diff: diff.groups['site-settings'],
      exported: data.globals?.siteSettings,
    })
  }

  if (diff.groups['frontend-variants']) {
    const current = await args.payload.findGlobal({
      depth: 0,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: false,
      req: buildLocalRequest(args.user),
      slug: 'frontend-variants',
      user: args.user,
    } as never)

    await previewGlobalDiff({
      current,
      diff: diff.groups['frontend-variants'],
      exported: data.globals?.frontendVariants,
    })
  }

  if (diff.groups.media) {
    for (const media of data.collections?.media ?? []) {
      const existing = await findMediaMatch(args.payload, args.user, media)

      if (!existing) {
        diff.groups.media.creates += 1
        continue
      }

      const comparableExisting = stripSystemFields(existing)
      const comparableImport = stripSystemFields(media)

      if (hashValue(comparableExisting) === hashValue(comparableImport)) {
        diff.groups.media.skips += 1
      } else {
        diff.groups.media.updates += 1
      }
    }
  }

  if (diff.groups.posts) {
    for (const post of data.collections?.posts ?? []) {
      const slug = getString(post.slug)

      if (!slug) {
        diff.groups.posts.conflicts += 1
        diff.groups.posts.warnings.push('A post in the import package is missing a slug.')
        continue
      }

      const existing = await findPostBySlug(args.payload, args.user, slug)

      if (!existing) {
        diff.groups.posts.creates += 1
        continue
      }

      if (hashValue(stripSystemFields(existing)) === hashValue(getPostComparableData(post))) {
        diff.groups.posts.skips += 1
      } else {
        diff.groups.posts.updates += 1
      }
    }
  }

  if (diff.groups['post-versions']) {
    const lookup = buildPostLookup(data.collections?.posts)

    for (const version of data.versions?.posts ?? []) {
      const parentSlug =
        getString(version.parentSlug) ??
        (version.parentSourceID === undefined
          ? undefined
          : lookup.slugBySourceID.get(String(version.parentSourceID)))

      if (!parentSlug) {
        diff.groups['post-versions'].conflicts += 1
        diff.groups['post-versions'].warnings.push('A post version is missing its parent slug.')
        continue
      }

      const existingPost = await findPostBySlug(args.payload, args.user, parentSlug)

      if (!existingPost?.id) {
        diff.groups['post-versions'].creates += 1
        continue
      }

      const hashes = await findPostVersionHashes(
        args.payload,
        args.user,
        existingPost.id as number | string,
      )
      const incomingHash = hashValue({
        autosave: version.autosave,
        publishedLocale: version.publishedLocale,
        version: stripSystemFields(version.version),
      })

      if (hashes.has(incomingHash)) {
        diff.groups['post-versions'].skips += 1
      } else {
        diff.groups['post-versions'].creates += 1
      }
    }
  }

  if (diff.groups['post-view-metrics']) {
    for (const metric of data.collections?.postViewMetrics ?? []) {
      const postSlug = getString(metric.postSlug)

      if (!postSlug || !metric.locale) {
        diff.groups['post-view-metrics'].conflicts += 1
        diff.groups['post-view-metrics'].warnings.push(
          'A post view metric is missing its post slug or locale.',
        )
        continue
      }

      const post = await findPostBySlug(args.payload, args.user, postSlug)

      if (!post?.id) {
        diff.groups['post-view-metrics'].conflicts += 1
        diff.groups['post-view-metrics'].warnings.push(
          `Post view metric for "${postSlug}" cannot be restored until the post exists.`,
        )
        continue
      }

      const metricKey = getPostViewMetricKey({
        locale: metric.locale,
        postId: Number(post.id),
      })
      const existing = await findOneByField({
        collection: 'post-view-metrics',
        field: 'metricKey',
        payload: args.payload,
        user: args.user,
        value: metricKey,
      })

      if (existing) {
        diff.groups['post-view-metrics'].updates += 1
      } else {
        diff.groups['post-view-metrics'].creates += 1
      }
    }
  }

  return diff
}

export async function previewSiteDataImport(args: {
  file: File
  payload: Payload
  user: User
}): Promise<SiteDataImportPreview> {
  const bytes = new Uint8Array(await args.file.arrayBuffer())
  const archive = parseArchiveBytes(bytes)
  const token = await writeImportPreviewFile(bytes)
  const diff = await createImportDiff({
    archive,
    payload: args.payload,
    user: args.user,
  })

  return {
    diff,
    manifest: archive.manifest,
    summary: createSiteDataTransferDiffSummary(diff),
    token,
  }
}

async function buildExistingRelationshipMaps(args: {
  archive: ParsedArchive
  payload: Payload
  user: User
}): Promise<RelationshipMaps> {
  const maps: RelationshipMaps = {
    media: new Map(),
    posts: new Map(),
  }

  for (const media of args.archive.data.collections?.media ?? []) {
    const existing = await findMediaMatch(args.payload, args.user, media)

    if (existing?.id) {
      maps.media.set(String(media.sourceID), existing.id as number | string)
    }
  }

  for (const post of args.archive.data.collections?.posts ?? []) {
    const slug = getString(post.slug)

    if (!slug) {
      continue
    }

    const existing = await findPostBySlug(args.payload, args.user, slug)

    if (existing?.id) {
      maps.posts.set(String(post.sourceID), existing.id as number | string)
    }
  }

  return maps
}

async function importMediaGroup(args: {
  archive: ParsedArchive
  maps: RelationshipMaps
  payload: Payload
  user: User
}) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zblog-site-data-media-'))

  try {
    for (const media of args.archive.data.collections?.media ?? []) {
      const existing = await findMediaMatch(args.payload, args.user, media)
      const data = buildMediaData(media, args.maps)
      const archivePath = media.archivePath ? normalizeArchiveEntryPath(media.archivePath) : null
      const archiveEntry = archivePath ? args.archive.entries[archivePath] : undefined
      let filePath: string | undefined

      if (archiveEntry && media.filename) {
        filePath = path.join(tempDir, path.basename(media.filename))
        await fs.writeFile(filePath, Buffer.from(archiveEntry))
      }

      if (!existing && !filePath) {
        continue
      }

      const result = existing
        ? ((await args.payload.update({
            collection: 'media',
            data,
            ...(filePath
              ? {
                  filePath,
                  overwriteExistingFiles: true,
                }
              : {}),
            id: existing.id as number | string,
            overrideAccess: false,
            req: buildLocalRequest(args.user),
            user: args.user,
          } as never)) as unknown as JsonRecord)
        : ((await args.payload.create({
            collection: 'media',
            data,
            filePath,
            overrideAccess: false,
            req: buildLocalRequest(args.user),
            user: args.user,
          } as never)) as unknown as JsonRecord)

      if (result.id) {
        args.maps.media.set(String(media.sourceID), result.id as number | string)
      }
    }
  } finally {
    await fs.rm(tempDir, {
      force: true,
      recursive: true,
    })
  }
}

async function importGlobalGroup(args: {
  data: JsonRecord | undefined
  maps: RelationshipMaps
  payload: Payload
  slug: 'frontend-variants' | 'site-settings'
  user: User
}) {
  if (!args.data) {
    return
  }

  await args.payload.updateGlobal({
    data: rewriteRelationships(stripSystemFields(args.data), args.maps) as JsonRecord,
    locale: 'all',
    overrideAccess: false,
    req: buildLocalRequest(args.user),
    slug: args.slug,
    user: args.user,
  } as never)
}

async function importPostsGroup(args: {
  archive: ParsedArchive
  maps: RelationshipMaps
  payload: Payload
  user: User
}) {
  for (const post of args.archive.data.collections?.posts ?? []) {
    const slug = getString(post.slug)

    if (!slug) {
      continue
    }

    const existing = await findPostBySlug(args.payload, args.user, slug)
    const createLocale = getCreateLocale(post)
    const createLocaleData = buildPostLocaleData(post, createLocale)
    const sharedData = buildSharedPostData(post, args.maps)
    const draft = normalizeStatus(post._status) !== 'published'
    let storedPost = existing

    if (!existing) {
      if (!isUsableLocalePostData(createLocaleData)) {
        continue
      }

      storedPost = (await args.payload.create({
        collection: 'posts',
        data: {
          ...sharedData,
          ...createLocaleData,
        },
        draft,
        locale: createLocale,
        overrideAccess: false,
        req: buildLocalRequest(args.user, createLocale),
        user: args.user,
      } as never)) as unknown as JsonRecord
    } else {
      storedPost = (await args.payload.update({
        collection: 'posts',
        data: {
          ...sharedData,
          ...createLocaleData,
        },
        draft,
        id: existing.id as number | string,
        locale: createLocale,
        overrideAccess: false,
        req: buildLocalRequest(args.user, createLocale),
        user: args.user,
      } as never)) as unknown as JsonRecord
    }

    if (!storedPost?.id) {
      continue
    }

    args.maps.posts.set(String(post.sourceID), storedPost.id as number | string)

    for (const locale of localeCodes) {
      if (locale === createLocale) {
        continue
      }

      const localeData = buildPostLocaleData(post, locale)

      if (!isUsableLocalePostData(localeData)) {
        continue
      }

      await args.payload.update({
        collection: 'posts',
        data: localeData,
        draft,
        id: storedPost.id as number | string,
        locale,
        overrideAccess: false,
        req: buildLocalRequest(args.user, locale),
        user: args.user,
      } as never)
    }
  }
}

async function assignMediaOwners(args: {
  archive: ParsedArchive
  maps: RelationshipMaps
  payload: Payload
  user: User
}) {
  for (const media of args.archive.data.collections?.media ?? []) {
    const mediaID = args.maps.media.get(String(media.sourceID))
    const ownerSourceID = getRelationID(media.ownerPost)

    if (!mediaID || ownerSourceID === undefined) {
      continue
    }

    const ownerPost = args.maps.posts.get(String(ownerSourceID))

    if (!ownerPost) {
      continue
    }

    await args.payload.update({
      collection: 'media',
      data: {
        ownerPost,
      },
      id: mediaID,
      overrideAccess: false,
      req: buildLocalRequest(args.user),
      user: args.user,
    } as never)
  }
}

async function importPostVersionsGroup(args: {
  archive: ParsedArchive
  maps: RelationshipMaps
  payload: Payload
  user: User
}) {
  const lookup = buildPostLookup(args.archive.data.collections?.posts)

  for (const version of args.archive.data.versions?.posts ?? []) {
    const parentSourceID =
      version.parentSourceID === undefined ? undefined : String(version.parentSourceID)
    const parentSlug =
      getString(version.parentSlug) ??
      (parentSourceID ? lookup.slugBySourceID.get(parentSourceID) : undefined)
    let parentID = parentSourceID ? args.maps.posts.get(parentSourceID) : undefined

    if (!parentID && parentSlug) {
      const existingPost = await findPostBySlug(args.payload, args.user, parentSlug)

      parentID = existingPost?.id as number | string | undefined
    }

    if (!parentID || !isRecord(version.version)) {
      continue
    }

    const existingHashes = await findPostVersionHashes(args.payload, args.user, parentID)
    const versionData = rewriteRelationships(
      stripSystemFields(version.version),
      args.maps,
    ) as JsonRecord
    const incomingHash = hashValue({
      autosave: version.autosave,
      publishedLocale: version.publishedLocale,
      version: stripSystemFields(versionData),
    })

    if (existingHashes.has(incomingHash)) {
      continue
    }

    await args.payload.db.createVersion({
      autosave: Boolean(version.autosave),
      collectionSlug: 'posts',
      createdAt: getString(version.createdAt) ?? new Date().toISOString(),
      parent: parentID,
      publishedLocale: getString(version.publishedLocale),
      req: buildLocalRequest(args.user),
      updatedAt:
        getString(version.updatedAt) ?? getString(version.createdAt) ?? new Date().toISOString(),
      versionData,
    })
  }
}

async function importPostMetricsGroup(args: {
  archive: ParsedArchive
  maps: RelationshipMaps
  payload: Payload
  user: User
}) {
  const lookup = buildPostLookup(args.archive.data.collections?.posts)

  for (const metric of args.archive.data.collections?.postViewMetrics ?? []) {
    const postSourceID = metric.postSourceID === undefined ? undefined : String(metric.postSourceID)
    const postSlug =
      getString(metric.postSlug) ??
      (postSourceID ? lookup.slugBySourceID.get(postSourceID) : undefined)
    let postID = postSourceID ? args.maps.posts.get(postSourceID) : undefined

    if (!postID && postSlug) {
      const existingPost = await findPostBySlug(args.payload, args.user, postSlug)

      postID = existingPost?.id as number | string | undefined
    }

    if (!postID || !metric.locale) {
      continue
    }

    const metricKey = getPostViewMetricKey({
      locale: metric.locale,
      postId: Number(postID),
    })
    const data = cloneWithoutUndefined({
      lastViewedAt: metric.lastViewedAt,
      locale: metric.locale,
      metricKey,
      post: postID,
      rawHits: getNumber(metric.rawHits) ?? 0,
      uniqueVisitors: getNumber(metric.uniqueVisitors) ?? 0,
      viewCount: getNumber(metric.viewCount) ?? 0,
    })
    const existing = await findOneByField({
      collection: 'post-view-metrics',
      field: 'metricKey',
      payload: args.payload,
      user: args.user,
      value: metricKey,
    })

    if (existing?.id) {
      await args.payload.update({
        collection: 'post-view-metrics',
        data,
        id: existing.id as number | string,
        overrideAccess: false,
        req: buildLocalRequest(args.user),
        user: args.user,
      } as never)
    } else {
      await args.payload.create({
        collection: 'post-view-metrics',
        data,
        overrideAccess: false,
        req: buildLocalRequest(args.user),
        user: args.user,
      } as never)
    }
  }
}

export async function commitSiteDataImport(args: {
  groups: unknown
  payload: Payload
  token: string
  user: User
}): Promise<SiteDataImportCommitResult> {
  const archive = await readImportFile(args.token)
  const requestedGroups = normalizeDataTransferGroups(args.groups)
  const appliedGroups = requestedGroups.filter((group) => archive.manifest.groups.includes(group))
  const maps = await buildExistingRelationshipMaps({
    archive,
    payload: args.payload,
    user: args.user,
  })

  if (appliedGroups.includes('media')) {
    await importMediaGroup({
      archive,
      maps,
      payload: args.payload,
      user: args.user,
    })
  }

  if (appliedGroups.includes('site-settings')) {
    await importGlobalGroup({
      data: archive.data.globals?.siteSettings,
      maps,
      payload: args.payload,
      slug: 'site-settings',
      user: args.user,
    })
  }

  if (appliedGroups.includes('frontend-variants')) {
    await importGlobalGroup({
      data: archive.data.globals?.frontendVariants,
      maps,
      payload: args.payload,
      slug: 'frontend-variants',
      user: args.user,
    })
  }

  if (appliedGroups.includes('posts')) {
    await importPostsGroup({
      archive,
      maps,
      payload: args.payload,
      user: args.user,
    })
  }

  if (appliedGroups.includes('media')) {
    await assignMediaOwners({
      archive,
      maps,
      payload: args.payload,
      user: args.user,
    })
  }

  if (appliedGroups.includes('post-versions')) {
    await importPostVersionsGroup({
      archive,
      maps,
      payload: args.payload,
      user: args.user,
    })
  }

  if (appliedGroups.includes('post-view-metrics')) {
    await importPostMetricsGroup({
      archive,
      maps,
      payload: args.payload,
      user: args.user,
    })
  }

  const diff = await createImportDiff({
    archive,
    payload: args.payload,
    user: args.user,
  })

  const importFilePath = getImportFilePath(args.token)

  if (importFilePath) {
    await fs.rm(importFilePath, {
      force: true,
    })
  }

  return {
    appliedGroups,
    diff,
    manifest: archive.manifest,
    summary: createSiteDataTransferDiffSummary(diff),
  }
}

export { createImportDiff as createSiteDataImportDiff }
