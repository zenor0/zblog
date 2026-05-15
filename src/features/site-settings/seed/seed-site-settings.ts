import type { Payload } from 'payload'

import type { SiteSetting } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'

import { defaultLocale, localeCodes, normalizeLocale } from '@/shared/i18n/locales'
import {
  getStarterSiteFooterPreset,
  mergeStarterGlobalVariables,
} from '@/features/site-settings/model/site-footer-preset'

type SeedSettingsPayload = Pick<Payload, 'findGlobal' | 'updateGlobal'>
type SiteSettingsData = Partial<SiteSetting>
type FooterData = NonNullable<SiteSetting['footer']>
type FooterBrand = FooterData['brand']
type FooterLink = FooterBrand['link']
type FooterNavigationSection = NonNullable<FooterData['navigationSections']>[number]
type FooterNavigationLink = NonNullable<FooterNavigationSection['links']>[number]
type FooterSocialLink = NonNullable<FooterData['socialLinks']>[number]
type FooterContactItem = NonNullable<FooterData['contactItems']>[number]
type FooterLegalLink = NonNullable<FooterData['legalLinks']>[number]
type FooterComplianceFiling = NonNullable<
  NonNullable<FooterData['compliance']>['filings']
>[number]

const seedSettingsCopy = {
  en: {
    homeHero: {
      description: 'A simple blog for articles, notes, and project updates.',
      eyebrow: 'Personal Blog',
      title: 'Notes on tech, products, and everyday work',
    },
    seo: {
      homeDescription: 'A bilingual blog about tech, products, and everyday work.',
      homeTitle: 'ZBlog | Notes on tech, products, and everyday work',
    },
    siteDescription: 'A bilingual blog about tech, products, and everyday work.',
    siteName: 'ZBlog',
  },
  'zh-Hans': {
    homeHero: {
      description: '这里会持续发布文章、笔记和项目更新。',
      eyebrow: '个人博客',
      title: '记录技术、产品与日常思考',
    },
    seo: {
      homeDescription: '一个持续记录技术、产品与日常工作的双语博客。',
      homeTitle: 'ZBlog | 记录技术、产品与日常思考',
    },
    siteDescription: '一个持续记录技术、产品与日常工作的双语博客。',
    siteName: 'ZBlog',
  },
} as const satisfies Record<
  AppLocale,
  {
    homeHero: NonNullable<SiteSetting['homeHero']>
    seo: Pick<NonNullable<SiteSetting['seo']>, 'homeDescription' | 'homeTitle'>
    siteDescription: string
    siteName: string
  }
>

function getSeedLocale(locale: AppLocale | null | string | undefined): AppLocale {
  return normalizeLocale(locale) ?? defaultLocale
}

function hasUsefulValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
}

function preferExisting<T>(existing: T | null | undefined, starter: T): T {
  return hasUsefulValue(existing) ? (existing as T) : starter
}

function mergeFooterLink(
  existing: FooterLink | null | undefined,
  starter: FooterLink,
): FooterLink {
  return {
    externalUrl: preferExisting(existing?.externalUrl, starter.externalUrl ?? null),
    internalPath: preferExisting(existing?.internalPath, starter.internalPath ?? null),
    openInNewTab: existing?.openInNewTab ?? starter.openInNewTab ?? false,
    type: preferExisting(existing?.type, starter.type),
  }
}

function mergeByIndex<T>(
  existingItems: T[] | null | undefined,
  starterItems: T[] | null | undefined,
  mergeItem: (existing: T | null | undefined, starter: T) => T,
) {
  const existing = Array.isArray(existingItems) ? existingItems : []
  const starter = Array.isArray(starterItems) ? starterItems : []
  const starterRows = starter.map((starterItem, index) => mergeItem(existing[index], starterItem))

  return [...starterRows, ...existing.slice(starter.length)]
}

function mergeByKey<T extends Record<string, unknown>>(
  existingItems: T[] | null | undefined,
  starterItems: T[] | null | undefined,
  getKey: (item: T) => string,
) {
  const existing = Array.isArray(existingItems) ? existingItems : []
  const starter = Array.isArray(starterItems) ? starterItems : []
  const existingByKey = new Map(
    existing.map((item) => [getKey(item), item] as const).filter(([key]) => Boolean(key)),
  )
  const starterKeys = new Set(starter.map(getKey).filter(Boolean))
  const starterRows = starter.map((starterItem) => {
    const existingItem = existingByKey.get(getKey(starterItem))

    return existingItem
      ? ({
          ...starterItem,
          ...Object.fromEntries(
            Object.entries(existingItem).map(([key, existingValue]) => [
              key,
              hasUsefulValue(existingValue) ? existingValue : starterItem[key],
            ]),
          ),
        } as T)
      : starterItem
  })

  return [...starterRows, ...existing.filter((item) => !starterKeys.has(getKey(item)))]
}

function mergeBrand(existing: FooterBrand | null | undefined, starter: FooterBrand): FooterBrand {
  return {
    description: preferExisting(existing?.description, starter.description ?? null),
    link: mergeFooterLink(existing?.link, starter.link),
    logo: preferExisting(existing?.logo, starter.logo ?? null),
    name: preferExisting(existing?.name, starter.name ?? null),
    supportingText: preferExisting(existing?.supportingText, starter.supportingText ?? null),
  }
}

function mergeNavigationLink(
  existing: FooterNavigationLink | null | undefined,
  starter: FooterNavigationLink,
): FooterNavigationLink {
  return {
    description: preferExisting(existing?.description, starter.description ?? null),
    id: existing?.id,
    label: preferExisting(existing?.label, starter.label),
    link: mergeFooterLink(existing?.link, starter.link),
  }
}

function mergeNavigationSection(
  existing: FooterNavigationSection | null | undefined,
  starter: FooterNavigationSection,
): FooterNavigationSection {
  return {
    id: existing?.id,
    links: mergeByIndex(existing?.links, starter.links, mergeNavigationLink),
    title: preferExisting(existing?.title, starter.title),
  }
}

function mergeContactItem(
  existing: FooterContactItem | null | undefined,
  starter: FooterContactItem,
): FooterContactItem {
  return {
    id: existing?.id,
    label: preferExisting(existing?.label, starter.label),
    link: mergeFooterLink(existing?.link, starter.link),
    value: preferExisting(existing?.value, starter.value),
  }
}

function mergeLegalLink(
  existing: FooterLegalLink | null | undefined,
  starter: FooterLegalLink,
): FooterLegalLink {
  return {
    id: existing?.id,
    label: preferExisting(existing?.label, starter.label),
    link: mergeFooterLink(existing?.link, starter.link),
  }
}

function mergeComplianceFiling(
  existing: FooterComplianceFiling | null | undefined,
  starter: FooterComplianceFiling,
): FooterComplianceFiling {
  return {
    href: preferExisting(existing?.href, starter.href ?? null),
    id: existing?.id,
    label: preferExisting(existing?.label, starter.label),
    value: preferExisting(existing?.value, starter.value),
  }
}

function mergeFooterSettings(
  existing: SiteSettingsData['footer'] | null | undefined,
  starter: SiteSettingsData['footer'],
): SiteSettingsData['footer'] {
  if (!starter) {
    return existing ?? undefined
  }

  return {
    bottomBar: {
      note: preferExisting(existing?.bottomBar?.note, starter.bottomBar?.note ?? null),
    },
    brand: mergeBrand(existing?.brand, starter.brand),
    compliance: {
      copyright: preferExisting(
        existing?.compliance?.copyright,
        starter.compliance?.copyright ?? null,
      ),
      filings: mergeByIndex(
        existing?.compliance?.filings,
        starter.compliance?.filings,
        mergeComplianceFiling,
      ),
    },
    contactItems: mergeByIndex(existing?.contactItems, starter.contactItems, mergeContactItem),
    layoutStyle: preferExisting(existing?.layoutStyle, starter.layoutStyle),
    legalLinks: mergeByIndex(existing?.legalLinks, starter.legalLinks, mergeLegalLink),
    navigationSections: mergeByIndex(
      existing?.navigationSections,
      starter.navigationSections,
      mergeNavigationSection,
    ),
    socialLinks: mergeByKey<FooterSocialLink>(
      existing?.socialLinks,
      starter.socialLinks,
      (item) => String(item.platform ?? ''),
    ),
  }
}

export function buildSeedSiteSettingsData(args: {
  locale: AppLocale | null | string | undefined
  settings: SiteSettingsData
}): SiteSettingsData {
  const locale = getSeedLocale(args.locale)
  const copy = seedSettingsCopy[locale]
  const starter = getStarterSiteFooterPreset(locale)

  return {
    footer: mergeFooterSettings(args.settings.footer, starter.footer),
    globalVariables: mergeStarterGlobalVariables(
      args.settings.globalVariables,
      starter.globalVariables,
    ),
    homeHero: {
      ...args.settings.homeHero,
      description: preferExisting(args.settings.homeHero?.description, copy.homeHero.description),
      eyebrow: preferExisting(args.settings.homeHero?.eyebrow, copy.homeHero.eyebrow),
      title: preferExisting(args.settings.homeHero?.title, copy.homeHero.title),
    },
    seo: {
      ...args.settings.seo,
      homeDescription: preferExisting(
        args.settings.seo?.homeDescription,
        copy.seo.homeDescription,
      ),
      homeTitle: preferExisting(args.settings.seo?.homeTitle, copy.seo.homeTitle),
    },
    siteDescription: preferExisting(args.settings.siteDescription, copy.siteDescription),
    siteName: preferExisting(args.settings.siteName, copy.siteName),
  }
}

export async function seedSiteSettings(payload: SeedSettingsPayload) {
  for (const locale of localeCodes) {
    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
      fallbackLocale: false,
      locale,
    })) as SiteSettingsData

    await payload.updateGlobal({
      slug: 'site-settings',
      locale,
      data: buildSeedSiteSettingsData({
        locale,
        settings,
      }),
    })
  }
}
