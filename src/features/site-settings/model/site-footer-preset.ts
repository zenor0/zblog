import type { AppLocale } from '@/shared/i18n/locales'
import type { SiteSettings } from '@/features/site-settings/model/site-settings'

import { defaultLocale, normalizeLocale } from '@/shared/i18n/locales'

type SiteFooterData = SiteSettings['footer']
type SiteGlobalVariables = SiteSettings['globalVariables']
type SocialLink = NonNullable<NonNullable<SiteGlobalVariables>['socialLinks']>[number]
type ContactVariable = NonNullable<NonNullable<SiteGlobalVariables>['contactItems']>[number]
type CustomVariable = NonNullable<NonNullable<SiteGlobalVariables>['customVariables']>[number]

export type StarterSiteFooterPreset = {
  footer: SiteFooterData
  globalVariables: SiteGlobalVariables
}

const starterCopy = {
  en: {
    about: 'About',
    archive: 'Archive',
    copyright: 'Copyright {{site.currentYear}} {{site.name}}. All rights reserved.',
    posts: 'Posts',
    privacy: 'Privacy',
    projects: 'Projects',
    read: 'Read',
    tagline: 'Notes about technology, products, and everyday work.',
  },
  'zh-Hans': {
    about: '关于',
    archive: '归档',
    copyright: 'Copyright {{site.currentYear}} {{site.name}}. All rights reserved.',
    posts: '文章',
    privacy: '隐私政策',
    projects: '项目',
    read: '阅读',
    tagline: '持续记录技术、产品与日常工作。',
  },
} as const satisfies Record<AppLocale, Record<string, string>>

function getStarterLocale(locale: AppLocale | null | string | undefined): AppLocale {
  return normalizeLocale(locale) ?? defaultLocale
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasUsefulValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
}

function preferExisting<T>(existing: T | null | undefined, starter: T | null | undefined) {
  return hasUsefulValue(existing) ? existing : starter
}

function getRecordValue<T extends Record<string, unknown>, K extends keyof T>(
  value: unknown,
  key: K,
): T[K] | undefined {
  return isRecord(value) ? (value[key as string] as T[K] | undefined) : undefined
}

function mergeOwnerVariables(
  existing: SiteGlobalVariables,
  starter: NonNullable<SiteGlobalVariables>,
): NonNullable<SiteGlobalVariables>['owner'] {
  const existingOwner = isRecord(existing?.owner) ? existing.owner : {}
  const starterOwner = starter.owner ?? {}

  return {
    ...starterOwner,
    ...existingOwner,
    avatar: preferExisting(existingOwner.avatar, starterOwner.avatar),
    bio: preferExisting(existingOwner.bio, starterOwner.bio),
    email: preferExisting(existingOwner.email, starterOwner.email),
    handle: preferExisting(existingOwner.handle, starterOwner.handle),
    name: preferExisting(existingOwner.name, starterOwner.name),
    websiteUrl: preferExisting(existingOwner.websiteUrl, starterOwner.websiteUrl),
  }
}

function mergeObjectVariables(
  existing: unknown,
  starter: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(existing) && !isRecord(starter)) {
    return undefined
  }

  return {
    ...(isRecord(starter) ? starter : {}),
    ...(isRecord(existing) ? existing : {}),
  }
}

function mergeArrayByKey<T extends Record<string, unknown>>(
  existing: null | T[] | undefined,
  starter: null | T[] | undefined,
  getKey: (item: T) => string,
) {
  const existingItems = Array.isArray(existing) ? existing : []
  const starterItems = Array.isArray(starter) ? starter : []
  const existingKeys = new Set(existingItems.map(getKey).filter(Boolean))
  const missingStarterItems = starterItems.filter((item) => !existingKeys.has(getKey(item)))

  return [...existingItems, ...missingStarterItems]
}

export function getStarterSiteFooterPreset(
  locale: AppLocale | null | string | undefined = defaultLocale,
): StarterSiteFooterPreset {
  const copy = starterCopy[getStarterLocale(locale)]

  return {
    footer: {
      layoutStyle: 'balanced',
      brand: {
        name: '{{site.name}}',
        description: '{{site.description}}',
        supportingText: '{{custom.tagline}}',
        link: {
          type: 'internal',
          internalPath: '/',
          openInNewTab: false,
        },
      },
      navigationSections: [
        {
          title: copy.read,
          links: [
            {
              label: copy.posts,
              link: {
                type: 'internal',
                internalPath: '/posts',
                openInNewTab: false,
              },
            },
            {
              label: copy.archive,
              link: {
                type: 'internal',
                internalPath: '/archive',
                openInNewTab: false,
              },
            },
          ],
        },
        {
          title: copy.about,
          links: [
            {
              label: copy.about,
              link: {
                type: 'internal',
                internalPath: '/about',
                openInNewTab: false,
              },
            },
            {
              label: copy.projects,
              link: {
                type: 'internal',
                internalPath: '/projects',
                openInNewTab: false,
              },
            },
          ],
        },
      ],
      socialLinks: [],
      contactItems: [],
      legalLinks: [
        {
          label: copy.privacy,
          link: {
            type: 'internal',
            internalPath: '/privacy',
            openInNewTab: false,
          },
        },
      ],
      compliance: {
        copyright: copy.copyright,
        filings: [],
      },
      bottomBar: {},
    },
    globalVariables: {
      socialLinks: [],
      contactItems: [],
      customVariables: [
        {
          key: 'tagline',
          value: copy.tagline,
          description: 'Short supporting line used by the starter footer.',
        },
      ],
    },
  }
}

export function mergeStarterGlobalVariables(
  existing: unknown,
  starter: SiteGlobalVariables,
): SiteGlobalVariables {
  const existingVariables = isRecord(existing) ? (existing as SiteGlobalVariables) : undefined
  const starterVariables = starter ?? {}

  return {
    assets: mergeObjectVariables(existingVariables?.assets, starterVariables.assets),
    owner: mergeOwnerVariables(existingVariables, starterVariables),
    socialLinks: mergeArrayByKey<SocialLink>(
      existingVariables?.socialLinks,
      starterVariables.socialLinks,
      (item) => String(getRecordValue<SocialLink, 'platform'>(item, 'platform') ?? ''),
    ),
    contactItems: mergeArrayByKey<ContactVariable>(
      existingVariables?.contactItems,
      starterVariables.contactItems,
      (item) => String(getRecordValue<ContactVariable, 'key'>(item, 'key') ?? ''),
    ),
    customVariables: mergeArrayByKey<CustomVariable>(
      existingVariables?.customVariables,
      starterVariables.customVariables,
      (item) => String(getRecordValue<CustomVariable, 'key'>(item, 'key') ?? ''),
    ),
  }
}
