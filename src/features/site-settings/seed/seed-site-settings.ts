import type { Payload } from 'payload'

import type { SiteSetting } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'

import { defaultLocale, localeCodes, normalizeLocale } from '@/shared/i18n/locales'
import { mergeStarterGlobalVariables } from '@/features/site-settings/model/site-footer-preset'

type SeedSettingsPayload = Pick<Payload, 'findGlobal' | 'updateGlobal'>
type SiteSettingsData = Partial<SiteSetting>
type AppearanceData = NonNullable<SiteSetting['appearance']>
type ArticleLayoutData = SiteSetting['articleLayout']
type ArticleLayoutTypography = NonNullable<ArticleLayoutData['typography']>
type ArticleLayoutAdvanced = NonNullable<ArticleLayoutData['advanced']>
type FooterData = NonNullable<SiteSetting['footer']>
type FooterBrand = FooterData['brand']
type FooterLink = FooterBrand['link']
type FooterNavigationSection = NonNullable<FooterData['navigationSections']>[number]
type FooterNavigationLink = NonNullable<FooterNavigationSection['links']>[number]
type FooterSocialLink = NonNullable<FooterData['socialLinks']>[number]
type FooterContactItem = NonNullable<FooterData['contactItems']>[number]
type FooterLegalLink = NonNullable<FooterData['legalLinks']>[number]
type GlobalVariablesData = NonNullable<SiteSetting['globalVariables']>
type FooterComplianceFiling = NonNullable<NonNullable<FooterData['compliance']>['filings']>[number]

type SeedSettingsDefaults = {
  appearance: AppearanceData
  articleLayout: ArticleLayoutData
  footer: FooterData
  globalVariables: GlobalVariablesData
  homeHero: NonNullable<SiteSetting['homeHero']>
  seo: Pick<NonNullable<SiteSetting['seo']>, 'homeDescription' | 'homeTitle'>
  siteDescription: string
  siteName: string
}

const seedSettingsDefaults = {
  en: {
    appearance: {
      accentColor: 'oklch(0.64 0.14 220)',
    },
    articleLayout: {
      articleLayoutEditorMode: 'form',
      advanced: {
        blockGap: '0.5rem',
        bodyFontSize: null,
        bodyLineHeight: null,
        captionGap: null,
        contentWidth: null,
        flowGap: null,
        gridGap: null,
        paragraphGap: null,
      },
      preset: 'compact-editorial',
      typography: {
        cjkFont: null,
        codeFont: null,
        headingFont: null,
        latinFont: null,
      },
    },
    footer: {
      bottomBar: {
        note: '',
      },
      brand: {
        description: '{{site.description}}',
        link: {
          internalPath: '/',
          openInNewTab: false,
          type: 'internal',
        },
        logo: null,
        name: '{{site.name}}',
        supportingText: '{{custom.tagline}}',
      },
      compliance: {
        copyright: 'Copyright {{site.currentYear}} {{site.name}}. All rights reserved.',
        filings: [
          {
            href: 'https://beian.miit.gov.cn',
            label: '',
            value: '中 ICP 备 20xx123456 号',
          },
          {
            href: 'https://github.com/zenor0/zblog',
            label: '',
            value: 'Powered by zblog',
          },
        ],
      },
      contactItems: [],
      footerEditorMode: 'form',
      layoutStyle: 'balanced',
      legalLinks: [
        {
          label: 'Privacy',
          link: {
            internalPath: '/privacy',
            openInNewTab: false,
            type: 'internal',
          },
        },
        {
          label: 'Terms',
          link: {
            internalPath: '/terms',
            openInNewTab: false,
            type: 'internal',
          },
        },
        {
          label: 'RSS',
          link: {
            internalPath: '/rss.xml',
            openInNewTab: false,
            type: 'internal',
          },
        },
        {
          label: 'Sitemap',
          link: {
            externalUrl: '/sitemap.xml',
            openInNewTab: false,
            type: 'external',
          },
        },
      ],
      navigationSections: [
        {
          links: [
            {
              label: 'Posts',
              link: {
                internalPath: '/posts',
                openInNewTab: false,
                type: 'internal',
              },
            },
            {
              label: 'Archive',
              link: {
                internalPath: '/archive',
                openInNewTab: false,
                type: 'internal',
              },
            },
          ],
          title: 'Read',
        },
        {
          links: [
            {
              label: 'About',
              link: {
                internalPath: '/about',
                openInNewTab: false,
                type: 'internal',
              },
            },
            {
              label: 'Projects',
              link: {
                internalPath: '/projects',
                openInNewTab: false,
                type: 'internal',
              },
            },
          ],
          title: 'About',
        },
      ],
      socialLinks: [
        {
          label: '@zenor0',
          openInNewTab: true,
          platform: 'github',
          url: 'https://github.com/zenor0',
        },
        {
          label: 'zenor0@outlook.com',
          openInNewTab: true,
          platform: 'email',
          url: 'mailto:zenor0@outlook.com',
        },
      ],
    },
    globalVariables: {
      assets: {
        avatar: null,
        defaultSocialImage: null,
        icon: null,
        logo: null,
      },
      contactItems: [],
      customVariables: [
        {
          description: 'Short supporting line used by the starter footer.',
          key: 'tagline',
          value: 'Notes about technology, products, and everyday work.',
        },
        {
          description: 'Controls the site header tagline: hidden, inline, or stacked.',
          key: 'headerTaglineMode',
          value: 'hidden',
        },
      ],
      owner: {
        avatar: null,
        bio: null,
        email: 'zenor0@outlook.com',
        handle: '@zenor0',
        name: null,
        websiteUrl: 'blog.zenor0.site',
      },
      socialLinks: [
        {
          label: '@zenor0',
          openInNewTab: true,
          platform: 'github',
          url: 'https://github.com/zenor0',
        },
      ],
    },
    homeHero: {
      description: 'A simple blog for articles, notes, and project updates.',
      eyebrow: 'Personal Blog',
      title: 'Notes on tech, products, and everyday work',
    },
    seo: {
      homeDescription: 'A bilingual blog about tech, products, and everyday work.',
      homeTitle: 'ZBlog | Notes on tech, products, and everyday work',
    },
    siteDescription: '',
    siteName: 'zblog',
  },
  'zh-Hans': {
    appearance: {
      accentColor: 'oklch(0.64 0.14 220)',
    },
    articleLayout: {
      articleLayoutEditorMode: 'form',
      advanced: {
        blockGap: '0.5rem',
        bodyFontSize: null,
        bodyLineHeight: null,
        captionGap: null,
        contentWidth: null,
        flowGap: null,
        gridGap: null,
        paragraphGap: null,
      },
      preset: 'compact-editorial',
      typography: {
        cjkFont: null,
        codeFont: null,
        headingFont: null,
        latinFont: null,
      },
    },
    footer: {
      bottomBar: {
        note: '',
      },
      brand: {
        description: '{{site.description}}',
        link: {
          internalPath: '/',
          openInNewTab: false,
          type: 'internal',
        },
        logo: null,
        name: '{{site.name}}',
        supportingText: '{{custom.tagline}}',
      },
      compliance: {
        copyright: 'Copyright {{site.currentYear}} {{site.name}}. 保留所有权利。',
        filings: [
          {
            href: 'https://beian.miit.gov.cn',
            label: '',
            value: '中 ICP 备 20xx123456 号',
          },
          {
            href: 'https://github.com/zenor0/zblog',
            label: '',
            value: 'Powered by zblog',
          },
        ],
      },
      contactItems: [],
      footerEditorMode: 'form',
      layoutStyle: 'balanced',
      legalLinks: [
        {
          label: '隐私政策',
          link: {
            internalPath: '/privacy',
            openInNewTab: false,
            type: 'internal',
          },
        },
        {
          label: '用户协议',
          link: {
            internalPath: '/terms',
            openInNewTab: false,
            type: 'internal',
          },
        },
        {
          label: 'RSS',
          link: {
            internalPath: '/rss.xml',
            openInNewTab: false,
            type: 'internal',
          },
        },
        {
          label: '站点地图',
          link: {
            externalUrl: '/sitemap.xml',
            openInNewTab: false,
            type: 'external',
          },
        },
      ],
      navigationSections: [
        {
          links: [
            {
              label: '文章',
              link: {
                internalPath: '/posts',
                openInNewTab: false,
                type: 'internal',
              },
            },
            {
              label: '归档',
              link: {
                internalPath: '/archive',
                openInNewTab: false,
                type: 'internal',
              },
            },
          ],
          title: '阅读',
        },
        {
          links: [
            {
              label: '关于',
              link: {
                internalPath: '/about',
                openInNewTab: false,
                type: 'internal',
              },
            },
            {
              label: '项目',
              link: {
                internalPath: '/projects',
                openInNewTab: false,
                type: 'internal',
              },
            },
          ],
          title: '关于',
        },
      ],
      socialLinks: [
        {
          label: '@zenor0',
          openInNewTab: true,
          platform: 'github',
          url: 'https://github.com/zenor0',
        },
        {
          label: 'zenor0@outlook.com',
          openInNewTab: true,
          platform: 'email',
          url: 'mailto:zenor0@outlook.com',
        },
      ],
    },
    globalVariables: {
      assets: {
        avatar: null,
        defaultSocialImage: null,
        icon: null,
        logo: null,
      },
      contactItems: [],
      customVariables: [
        {
          description: 'Short supporting line used by the starter footer.',
          key: 'tagline',
          value: '持续记录技术、产品与日常工作。',
        },
        {
          description: 'Controls the site header tagline: hidden, inline, or stacked.',
          key: 'headerTaglineMode',
          value: 'hidden',
        },
      ],
      owner: {
        avatar: null,
        bio: '你好，世界。',
        email: 'zenor0@outlook.com',
        handle: '@zenor0',
        name: 'zenor0',
        websiteUrl: 'blog.zenor0.site',
      },
      socialLinks: [
        {
          label: '@zenor0',
          openInNewTab: true,
          platform: 'github',
          url: 'https://github.com/zenor0',
        },
      ],
    },
    homeHero: {
      description: '你好，世界。',
      eyebrow: '个人博客',
      title: '坏坏学习',
    },
    seo: {
      homeDescription: '一个持续记录技术、产品与日常工作的博客。',
      homeTitle: 'ZBlog',
    },
    siteDescription: '',
    siteName: 'zblog',
  },
} satisfies Record<AppLocale, SeedSettingsDefaults>

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

function mergeFooterLink(existing: FooterLink | null | undefined, starter: FooterLink): FooterLink {
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

function mergeAppearanceSettings(
  existing: SiteSettingsData['appearance'] | null | undefined,
  starter: AppearanceData,
): AppearanceData {
  return {
    accentColor: preferExisting(existing?.accentColor, starter.accentColor ?? null),
  }
}

function mergeArticleTypography(
  existing: ArticleLayoutData['typography'] | null | undefined,
  starter: ArticleLayoutTypography,
): ArticleLayoutTypography {
  return {
    cjkFont: preferExisting(existing?.cjkFont, starter.cjkFont ?? null),
    codeFont: preferExisting(existing?.codeFont, starter.codeFont ?? null),
    headingFont: preferExisting(existing?.headingFont, starter.headingFont ?? null),
    latinFont: preferExisting(existing?.latinFont, starter.latinFont ?? null),
  }
}

function mergeArticleAdvanced(
  existing: ArticleLayoutData['advanced'] | null | undefined,
  starter: ArticleLayoutAdvanced,
): ArticleLayoutAdvanced {
  return {
    blockGap: preferExisting(existing?.blockGap, starter.blockGap ?? null),
    bodyFontSize: preferExisting(existing?.bodyFontSize, starter.bodyFontSize ?? null),
    bodyLineHeight: preferExisting(existing?.bodyLineHeight, starter.bodyLineHeight ?? null),
    captionGap: preferExisting(existing?.captionGap, starter.captionGap ?? null),
    contentWidth: preferExisting(existing?.contentWidth, starter.contentWidth ?? null),
    flowGap: preferExisting(existing?.flowGap, starter.flowGap ?? null),
    gridGap: preferExisting(existing?.gridGap, starter.gridGap ?? null),
    paragraphGap: preferExisting(existing?.paragraphGap, starter.paragraphGap ?? null),
  }
}

function mergeArticleLayoutSettings(
  existing: SiteSettingsData['articleLayout'] | null | undefined,
  starter: ArticleLayoutData,
): ArticleLayoutData {
  return {
    advanced: mergeArticleAdvanced(existing?.advanced, starter.advanced ?? {}),
    articleLayoutEditorMode:
      existing?.articleLayoutEditorMode ?? starter.articleLayoutEditorMode ?? 'form',
    preset: preferExisting(existing?.preset, starter.preset),
    typography: mergeArticleTypography(existing?.typography, starter.typography ?? {}),
  }
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
    footerEditorMode: existing?.footerEditorMode ?? starter.footerEditorMode ?? 'form',
    layoutStyle: preferExisting(existing?.layoutStyle, starter.layoutStyle),
    legalLinks: mergeByIndex(existing?.legalLinks, starter.legalLinks, mergeLegalLink),
    navigationSections: mergeByIndex(
      existing?.navigationSections,
      starter.navigationSections,
      mergeNavigationSection,
    ),
    socialLinks: mergeByKey<FooterSocialLink>(existing?.socialLinks, starter.socialLinks, (item) =>
      String(item.platform ?? ''),
    ),
  }
}

export function buildSeedSiteSettingsData(args: {
  locale: AppLocale | null | string | undefined
  settings: SiteSettingsData
}): SiteSettingsData {
  const locale = getSeedLocale(args.locale)
  const starter = seedSettingsDefaults[locale]

  return {
    appearance: mergeAppearanceSettings(args.settings.appearance, starter.appearance),
    articleLayout: mergeArticleLayoutSettings(args.settings.articleLayout, starter.articleLayout),
    footer: mergeFooterSettings(args.settings.footer, starter.footer),
    globalVariables: mergeStarterGlobalVariables(
      args.settings.globalVariables,
      starter.globalVariables,
    ),
    homeHero: {
      ...args.settings.homeHero,
      description: preferExisting(
        args.settings.homeHero?.description,
        starter.homeHero.description,
      ),
      eyebrow: preferExisting(args.settings.homeHero?.eyebrow, starter.homeHero.eyebrow),
      title: preferExisting(args.settings.homeHero?.title, starter.homeHero.title),
    },
    seo: {
      ...args.settings.seo,
      homeDescription: preferExisting(
        args.settings.seo?.homeDescription,
        starter.seo.homeDescription,
      ),
      homeTitle: preferExisting(args.settings.seo?.homeTitle, starter.seo.homeTitle),
    },
    siteDescription: preferExisting(args.settings.siteDescription, starter.siteDescription),
    siteName: preferExisting(args.settings.siteName, starter.siteName),
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
