import { parseDocument, stringify } from 'yaml'

import type { SiteSetting } from '@/payload-types'

export const siteSettingsSectionIDs = [
  'general',
  'homepage',
  'seo',
  'articleLayout',
  'footer',
] as const

export type SiteSettingsSectionID = (typeof siteSettingsSectionIDs)[number]

type SiteSettingsRecord = Record<string, unknown>
type SiteSettingsReferenceContext = Record<string, unknown>

export type SiteSettingsReferenceValidation = {
  knownReferences: string[]
  unknownReferences: string[]
  valid: boolean
}

export const siteSettingsSectionLabels: Record<SiteSettingsSectionID, string> = {
  articleLayout: 'Article design',
  footer: 'Footer',
  general: 'General',
  homepage: 'Homepage',
  seo: 'SEO',
}

const sectionRootKeys = {
  articleLayout: ['articleLayout'],
  footer: ['footer'],
  general: ['siteName', 'siteDescription', 'globalVariables'],
  homepage: ['homeHero'],
  seo: ['seo'],
} as const satisfies Record<SiteSettingsSectionID, readonly string[]>

const objectRootKeys = new Set(['articleLayout', 'footer', 'globalVariables', 'homeHero', 'seo'])
const referencePattern = /{{\s*([^{}]+?)\s*}}/g
const referencePathPattern = /^[A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+$/
const customVariableKeyPattern = /^[A-Za-z][A-Za-z0-9_-]*$/

function hasOwn(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isRecord(value: unknown): value is SiteSettingsRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as T
  }

  return value
}

function pruneUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => pruneUndefined(item))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, pruneUndefined(item)]),
  )
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizePathSegment(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getMediaReferenceValue(value: unknown): unknown {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (isRecord(value)) {
    const id = value.id

    if (typeof id === 'number' || typeof id === 'string') {
      return id
    }

    const url = value.url

    if (typeof url === 'string') {
      return url
    }
  }

  return ''
}

function setContextValue(
  context: SiteSettingsReferenceContext,
  path: string,
  value: unknown,
  options?: { preserveExisting?: boolean },
) {
  if (options?.preserveExisting && hasOwn(context, path)) {
    return
  }

  context[path] = value
}

export function validateCustomVariableKey(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Variable key is required.'
  }

  return customVariableKeyPattern.test(value.trim())
    ? true
    : 'Use letters, numbers, underscores, or hyphens. The first character must be a letter.'
}

export function buildSiteVariableContext(settings: unknown): SiteSettingsReferenceContext {
  const data = isRecord(settings) ? settings : {}
  const globalVariables = isRecord(data.globalVariables) ? data.globalVariables : {}
  const owner = isRecord(globalVariables.owner) ? globalVariables.owner : {}
  const assets = isRecord(globalVariables.assets) ? globalVariables.assets : {}
  const context: SiteSettingsReferenceContext = {}

  setContextValue(context, 'site.name', normalizeText(data.siteName))
  setContextValue(context, 'site.description', normalizeText(data.siteDescription))
  setContextValue(context, 'site.currentYear', String(new Date().getFullYear()))
  setContextValue(context, 'owner.name', normalizeText(owner.name))
  setContextValue(context, 'owner.handle', normalizeText(owner.handle))
  setContextValue(context, 'owner.email', normalizeText(owner.email))
  setContextValue(context, 'owner.bio', normalizeText(owner.bio))
  setContextValue(context, 'owner.websiteUrl', normalizeText(owner.websiteUrl))
  setContextValue(context, 'assets.logo', getMediaReferenceValue(assets.logo))
  setContextValue(context, 'assets.icon', getMediaReferenceValue(assets.icon))
  setContextValue(context, 'assets.avatar', getMediaReferenceValue(assets.avatar ?? owner.avatar))
  setContextValue(
    context,
    'assets.defaultSocialImage',
    getMediaReferenceValue(assets.defaultSocialImage),
  )

  const socialLinks = Array.isArray(globalVariables.socialLinks) ? globalVariables.socialLinks : []

  socialLinks.forEach((item) => {
    if (!isRecord(item)) {
      return
    }

    const platform = normalizePathSegment(item.platform).toLowerCase()

    if (!customVariableKeyPattern.test(platform)) {
      return
    }

    setContextValue(context, `social.${platform}.label`, normalizeText(item.label), {
      preserveExisting: true,
    })
    setContextValue(context, `social.${platform}.url`, normalizeText(item.url), {
      preserveExisting: true,
    })
  })

  const contactItems = Array.isArray(globalVariables.contactItems)
    ? globalVariables.contactItems
    : []

  contactItems.forEach((item) => {
    if (!isRecord(item)) {
      return
    }

    const key = normalizePathSegment(item.key)

    if (!customVariableKeyPattern.test(key)) {
      return
    }

    setContextValue(context, `contact.${key}.label`, normalizeText(item.label), {
      preserveExisting: true,
    })
    setContextValue(context, `contact.${key}.value`, normalizeText(item.value), {
      preserveExisting: true,
    })
    setContextValue(context, `contact.${key}.url`, normalizeText(item.url), {
      preserveExisting: true,
    })
  })

  const customVariables = Array.isArray(globalVariables.customVariables)
    ? globalVariables.customVariables
    : []

  customVariables.forEach((item) => {
    if (!isRecord(item)) {
      return
    }

    const key = normalizePathSegment(item.key)

    if (!customVariableKeyPattern.test(key)) {
      return
    }

    setContextValue(context, `custom.${key}`, normalizeText(item.value), {
      preserveExisting: true,
    })
  })

  return context
}

function collectReferencePaths(value: unknown, references = new Set<string>()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(referencePattern)) {
      references.add(match[1]?.trim() ?? '')
    }

    return references
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectReferencePaths(item, references))
    return references
  }

  if (isRecord(value)) {
    Object.values(value).forEach((item) => collectReferencePaths(item, references))
  }

  return references
}

export function validateSiteSettingReferences(settings: unknown): SiteSettingsReferenceValidation {
  const context = buildSiteVariableContext(settings)
  const unknownReferences = [...collectReferencePaths(settings)].filter(
    (reference) => !referencePathPattern.test(reference) || !hasOwn(context, reference),
  )
  const uniqueUnknownReferences = [...new Set(unknownReferences)]

  return {
    knownReferences: Object.keys(context),
    unknownReferences: uniqueUnknownReferences,
    valid: uniqueUnknownReferences.length === 0,
  }
}

export function resolveTemplateString(
  value: string,
  context: SiteSettingsReferenceContext,
): unknown {
  const exactMatch = value.match(/^{{\s*([^{}]+?)\s*}}$/)

  if (exactMatch) {
    const reference = exactMatch[1]?.trim() ?? ''

    return hasOwn(context, reference) ? (context[reference] ?? '') : value
  }

  return value.replace(referencePattern, (match, reference: string) => {
    const path = reference.trim()

    return hasOwn(context, path) ? String(context[path] ?? '') : match
  })
}

function resolveReferencesInValue(
  value: unknown,
  context: SiteSettingsReferenceContext,
  path: string[] = [],
): unknown {
  if (path[0] === 'globalVariables') {
    return cloneValue(value)
  }

  if (typeof value === 'string') {
    return resolveTemplateString(value, context)
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      resolveReferencesInValue(item, context, [...path, String(index)]),
    )
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveReferencesInValue(item, context, [...path, key]),
      ]),
    )
  }

  return value
}

export function resolveSiteSettingReferences<T>(settings: T): T {
  const context = buildSiteVariableContext(settings)

  return resolveReferencesInValue(settings, context) as T
}

export function getSiteSettingsSectionRootKeys(section: SiteSettingsSectionID): readonly string[] {
  return sectionRootKeys[section]
}

export function serializeSiteSettingsSectionToYAML(
  section: SiteSettingsSectionID,
  settings: unknown,
) {
  const data = isRecord(settings) ? settings : {}
  const sectionData = Object.fromEntries(
    sectionRootKeys[section].map((key) => [key, cloneValue(data[key])]),
  )

  return stringify(pruneUndefined(sectionData), {
    indent: 2,
    lineWidth: 0,
  })
}

export function parseSiteSettingsSectionYAML(
  section: SiteSettingsSectionID,
  yamlSource: string,
): Partial<SiteSetting> {
  const document = parseDocument(yamlSource)

  if (document.errors.length > 0) {
    throw new Error(`Invalid YAML: ${document.errors[0]?.message ?? 'Could not parse section.'}`)
  }

  const value = document.toJS()

  if (!isRecord(value)) {
    throw new Error(`${siteSettingsSectionLabels[section]} YAML must be an object.`)
  }

  const allowedKeys = new Set<string>(sectionRootKeys[section])
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key))

  if (unknownKeys.length > 0) {
    throw new Error(
      `${unknownKeys.join(', ')} ${unknownKeys.length === 1 ? 'is' : 'are'} not allowed in ${
        siteSettingsSectionLabels[section]
      } YAML.`,
    )
  }

  Object.entries(value).forEach(([key, item]) => {
    if (item != null && objectRootKeys.has(key) && !isRecord(item)) {
      throw new Error(`${key} must be an object.`)
    }
  })

  return value as Partial<SiteSetting>
}

export function mergeSiteSettingsSection(
  settings: unknown,
  section: SiteSettingsSectionID,
  sectionData: unknown,
) {
  const base = cloneValue(isRecord(settings) ? settings : {})
  const data = isRecord(sectionData) ? sectionData : {}

  sectionRootKeys[section].forEach((key) => {
    if (hasOwn(data, key)) {
      base[key] = data[key]
    }
  })

  return base
}
