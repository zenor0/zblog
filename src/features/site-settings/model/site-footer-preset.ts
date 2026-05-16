import type { AppLocale } from '@/shared/i18n/locales'
import type { SiteSettings } from '@/features/site-settings/model/site-settings'

import { defaultLocale, normalizeLocale } from '@/shared/i18n/locales'
import { defaultSiteFooterLayoutStyle } from '@/features/site-settings/model/site-footer-layout'

type SiteFooterData = SiteSettings['footer']
type MaybeSiteFooterData = SiteFooterData | null | undefined
type FooterBrand = NonNullable<SiteFooterData>['brand']
type FooterContactItem = NonNullable<NonNullable<SiteFooterData>['contactItems']>[number]
type FooterLink = FooterBrand['link']
type FooterSocialLink = NonNullable<NonNullable<SiteFooterData>['socialLinks']>[number]
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
    terms: 'Terms',
  },
  'zh-Hans': {
    about: '关于',
    archive: '归档',
    copyright: 'Copyright {{site.currentYear}} {{site.name}}. 保留所有权利。',
    posts: '文章',
    privacy: '隐私政策',
    projects: '项目',
    read: '阅读',
    tagline: '持续记录技术、产品与日常工作。',
    terms: '用户协议',
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

function mergeRecordByUsefulValues<T extends Record<string, unknown>>(existing: T, starter: T): T {
  return {
    ...starter,
    ...Object.fromEntries(
      Object.entries(existing).map(([key, existingValue]) => {
        const starterValue = starter[key]

        return [key, hasUsefulValue(existingValue) ? existingValue : starterValue]
      }),
    ),
  } as T
}

function mergeArrayByKey<T extends Record<string, unknown>>(
  existing: null | T[] | undefined,
  starter: null | T[] | undefined,
  getKey: (item: T) => string,
) {
  const existingItems = Array.isArray(existing) ? existing : []
  const starterItems = Array.isArray(starter) ? starter : []
  const existingByKey = new Map(
    existingItems.map((item) => [getKey(item), item] as const).filter(([key]) => Boolean(key)),
  )
  const starterKeys = new Set(starterItems.map(getKey).filter(Boolean))
  const mergedStarterItems = starterItems.map((starterItem) => {
    const existingItem = existingByKey.get(getKey(starterItem))

    return existingItem ? mergeRecordByUsefulValues(existingItem, starterItem) : starterItem
  })
  const extraExistingItems = existingItems.filter((item) => !starterKeys.has(getKey(item)))

  return [...mergedStarterItems, ...extraExistingItems]
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
        {
          label: copy.terms,
          link: {
            type: 'internal',
            internalPath: '/terms',
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
        {
          key: 'headerTaglineMode',
          value: 'hidden',
          description: 'Controls the site header tagline: hidden, inline, or stacked.',
        },
      ],
    },
  }
}

function cloneFooterData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneFooterData(item)) as T
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneFooterData(item)]),
    ) as T
  }

  return value
}

function hasCustomVariable(globalVariables: SiteGlobalVariables, key: string) {
  return globalVariables?.customVariables?.some((item) => item.key === key) ?? false
}

function getReferencePath(prefix: string, key: string, property: string) {
  return `{{${prefix}.${key}.${property}}}`
}

function getTextValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getLinkURL(link: FooterLink | null | undefined) {
  if (!link) {
    return ''
  }

  return getTextValue(link.externalUrl) || getTextValue(link.internalPath)
}

function getFallbackFooter(footer: MaybeSiteFooterData): NonNullable<SiteFooterData> {
  return {
    bottomBar: footer?.bottomBar ?? {},
    brand: {
      ...(footer?.brand ?? {}),
      link: footer?.brand?.link ?? {
        type: 'internal',
        internalPath: '/',
        openInNewTab: false,
      },
    },
    compliance: footer?.compliance ?? {},
    contactItems: footer?.contactItems ?? [],
    layoutStyle: footer?.layoutStyle ?? defaultSiteFooterLayoutStyle,
    legalLinks: footer?.legalLinks ?? [],
    navigationSections: footer?.navigationSections ?? [],
    socialLinks: footer?.socialLinks ?? [],
  }
}

function mergeBrandFromGeneral(
  brand: FooterBrand,
  globalVariables: SiteGlobalVariables,
): FooterBrand {
  const logo = brand.logo ?? globalVariables?.assets?.logo ?? null
  const nextBrand: FooterBrand = {
    ...brand,
    description: hasUsefulValue(brand.description) ? brand.description : '{{site.description}}',
    link: brand.link ?? {
      type: 'internal',
      internalPath: '/',
      openInNewTab: false,
    },
    logo,
    name: hasUsefulValue(brand.name) ? brand.name : '{{site.name}}',
    supportingText:
      hasUsefulValue(brand.supportingText) || !hasCustomVariable(globalVariables, 'tagline')
        ? brand.supportingText
        : '{{custom.tagline}}',
  }

  if (!hasUsefulValue(nextBrand.link.internalPath) && !hasUsefulValue(nextBrand.link.externalUrl)) {
    nextBrand.link = {
      type: 'internal',
      internalPath: '/',
      openInNewTab: false,
    }
  }

  return nextBrand
}

function mergeSocialLinksFromGeneral(args: {
  footerSocialLinks: FooterSocialLink[] | null | undefined
  globalSocialLinks: SocialLink[] | null | undefined
}): FooterSocialLink[] {
  const existing = args.footerSocialLinks ?? []
  const existingPlatforms = new Set(existing.map((item) => item.platform))
  const existingURLs = new Set(existing.map((item) => getTextValue(item.url)).filter(Boolean))
  const additions =
    args.globalSocialLinks?.flatMap((item) => {
      const platform = item.platform
      const url = getTextValue(item.url)

      if (!platform || !url || existingPlatforms.has(platform) || existingURLs.has(url)) {
        return []
      }

      existingPlatforms.add(platform)
      existingURLs.add(url)

      return [
        {
          label: getReferencePath('social', platform, 'label'),
          openInNewTab: item.openInNewTab ?? true,
          platform,
          url: getReferencePath('social', platform, 'url'),
        },
      ]
    }) ?? []

  return [...existing, ...additions]
}

function footerContactExists(existing: FooterContactItem[], item: ContactVariable) {
  const key = getTextValue(item.key)
  const labelReference = key ? getReferencePath('contact', key, 'label') : ''
  const valueReference = key ? getReferencePath('contact', key, 'value') : ''
  const urlReference = key ? getReferencePath('contact', key, 'url') : ''
  const label = getTextValue(item.label)
  const value = getTextValue(item.value)
  const url = getTextValue(item.url)

  return existing.some((existingItem) => {
    const existingLabel = getTextValue(existingItem.label)
    const existingValue = getTextValue(existingItem.value)
    const existingURL = getLinkURL(existingItem.link)

    return (
      (labelReference && existingLabel === labelReference) ||
      (valueReference && existingValue === valueReference) ||
      (urlReference && existingURL === urlReference) ||
      (label && existingLabel === label) ||
      (value && existingValue === value) ||
      (url && existingURL === url)
    )
  })
}

function buildContactLink(urlReference: string): FooterLink {
  return {
    externalUrl: urlReference,
    openInNewTab: false,
    type: 'external',
  }
}

function mergeContactItemsFromGeneral(args: {
  footerContactItems: FooterContactItem[] | null | undefined
  globalVariables: SiteGlobalVariables
}): FooterContactItem[] {
  const existing = args.footerContactItems ?? []
  const contactItems = args.globalVariables?.contactItems ?? []
  const additions: FooterContactItem[] = []

  contactItems.forEach((item) => {
    const key = getTextValue(item.key)

    if (!key || footerContactExists([...existing, ...additions], item)) {
      return
    }

    const urlReference = getReferencePath('contact', key, 'url')

    additions.push({
      label: getReferencePath('contact', key, 'label'),
      link: buildContactLink(urlReference),
      value: getReferencePath('contact', key, 'value'),
    })
  })

  if (
    additions.length === 0 &&
    existing.length === 0 &&
    hasUsefulValue(args.globalVariables?.owner?.email)
  ) {
    additions.push({
      label: 'Email',
      link: {
        externalUrl: 'mailto:{{owner.email}}',
        openInNewTab: false,
        type: 'external',
      },
      value: '{{owner.email}}',
    })
  }

  return [...existing, ...additions]
}

export function mergeFooterFromGeneralSettings(args: {
  footer: MaybeSiteFooterData
  globalVariables: SiteGlobalVariables
}): SiteFooterData {
  const footer = getFallbackFooter(cloneFooterData(args.footer))

  return {
    ...footer,
    brand: mergeBrandFromGeneral(footer.brand, args.globalVariables),
    contactItems: mergeContactItemsFromGeneral({
      footerContactItems: footer.contactItems,
      globalVariables: args.globalVariables,
    }),
    socialLinks: mergeSocialLinksFromGeneral({
      footerSocialLinks: footer.socialLinks,
      globalSocialLinks: args.globalVariables?.socialLinks,
    }),
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
