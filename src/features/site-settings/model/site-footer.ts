import type { AppLocale } from '@/shared/i18n/locales'
import type { SiteSettings } from '@/features/site-settings/model/site-settings'

import { buildLocalePath, defaultLocale, normalizeLocale } from '@/shared/i18n/locales'
import {
  defaultSiteFooterLayoutStyle,
  resolveSiteFooterLayoutStyle,
  siteFooterLayoutStyleOptions,
  type SiteFooterLayoutStyle,
} from '@/features/site-settings/model/site-footer-layout'

export { defaultSiteFooterLayoutStyle, resolveSiteFooterLayoutStyle, siteFooterLayoutStyleOptions }
export type { SiteFooterLayoutStyle }

type FooterData = NonNullable<SiteSettings['footer']>
type FooterBrand = FooterData['brand']
type FooterLinkData = FooterBrand['link']

export type ResolvedFooterLink = {
  href: string
  isExternal: boolean
  rel?: string
  target?: string
}

export type NormalizedSiteFooter = {
  brand: {
    description: null | string
    href: null | string
    logo: FooterBrand['logo']
    name: string
    rel?: string
    supportingText: null | string
    target?: string
  }
  compliance: {
    copyright: null | string
    filings: {
      href: null | string
      label: string
      value: string
    }[]
    note: null | string
  }
  contactItems: {
    href: null | string
    label: string
    rel?: string
    target?: string
    value: string
  }[]
  legalLinks: {
    href: string
    label: string
    rel?: string
    target?: string
  }[]
  layoutStyle: SiteFooterLayoutStyle
  navigationSections: {
    links: {
      description: null | string
      href: string
      label: string
      rel?: string
      target?: string
    }[]
    title: string
  }[]
  socialLinks: {
    href: string
    label: string
    platform: FooterData['socialLinks'] extends (infer T)[] | null | undefined
      ? T extends { platform: infer P }
        ? P
        : string
      : string
    rel?: string
    target?: string
  }[]
}

export type SiteFooterLabels = {
  applyStarterFooter: string
  contactInformation: string
  fillFooterFromGeneral: string
  footerLinks: string
  footerFilledFromGeneral: string
  ownerProfileLinks: string
  previewFrameTitle: string
  previewNoContent: string
  previewSurface: string
  previewTitle: string
  previewWaiting: string
  starterFooterApplied: string
  utilityLinks: string
}

const siteFooterLabelsByLocale = {
  en: {
    applyStarterFooter: 'Apply starter footer',
    contactInformation: 'Footer contact information',
    fillFooterFromGeneral: 'Fill from General',
    footerFilledFromGeneral: 'Footer filled from General settings.',
    footerLinks: 'Footer links',
    ownerProfileLinks: 'Owner profile links',
    previewFrameTitle: 'Production footer preview',
    previewNoContent: 'No usable footer content yet.',
    previewSurface: 'Production iframe',
    previewTitle: 'Footer preview',
    previewWaiting: 'Waiting for footer data.',
    starterFooterApplied: 'Starter footer applied.',
    utilityLinks: 'Footer utility links',
  },
  'zh-Hans': {
    applyStarterFooter: '应用起始页脚',
    contactInformation: '页脚联系信息',
    fillFooterFromGeneral: '从 General 填充',
    footerFilledFromGeneral: '已从 General 设置填充页脚。',
    footerLinks: '页脚链接',
    ownerProfileLinks: '站点资料链接',
    previewFrameTitle: '生产页脚预览',
    previewNoContent: '还没有可用的页脚内容。',
    previewSurface: '生产 iframe',
    previewTitle: '页脚预览',
    previewWaiting: '等待页脚数据。',
    starterFooterApplied: '已应用起始页脚。',
    utilityLinks: '页脚辅助链接',
  },
} as const satisfies Record<AppLocale, SiteFooterLabels>

export function getSiteFooterLabels(
  locale: AppLocale | null | string | undefined = defaultLocale,
): SiteFooterLabels {
  return siteFooterLabelsByLocale[normalizeLocale(locale) ?? defaultLocale]
}

export function hasText(value: null | string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getExternalLinkProps(openInNewTab: boolean | null | undefined) {
  if (!openInNewTab) {
    return {}
  }

  return {
    rel: 'noreferrer',
    target: '_blank',
  } as const
}

export function resolveFooterLink(
  locale: AppLocale,
  link: FooterLinkData | null | undefined,
): null | ResolvedFooterLink {
  if (!link) {
    return null
  }

  if (link.type === 'internal' && hasText(link.internalPath)) {
    return {
      href: buildLocalePath(locale, link.internalPath),
      isExternal: false,
    }
  }

  if (link.type === 'external' && hasText(link.externalUrl)) {
    return {
      href: link.externalUrl,
      isExternal: true,
      ...getExternalLinkProps(link.openInNewTab),
    }
  }

  return null
}

export function normalizeSiteFooter(args: {
  locale: AppLocale
  settings: SiteSettings
}): null | NormalizedSiteFooter {
  const footer = args.settings.footer

  if (!footer) {
    return null
  }

  const brandLink = resolveFooterLink(args.locale, footer.brand?.link)
  const hasBrandContent =
    footer.brand?.logo != null ||
    hasText(footer.brand?.name) ||
    hasText(footer.brand?.description) ||
    hasText(footer.brand?.supportingText) ||
    brandLink != null

  const navigationSections =
    footer.navigationSections?.flatMap((section) => {
      if (!hasText(section?.title)) {
        return []
      }

      const links =
        section.links?.flatMap((item) => {
          const resolved = resolveFooterLink(args.locale, item?.link)

          if (!hasText(item?.label) || !resolved) {
            return []
          }

          return [
            {
              description: hasText(item.description) ? item.description : null,
              href: resolved.href,
              label: item.label,
              rel: resolved.rel,
              target: resolved.target,
            },
          ]
        }) ?? []

      return links.length > 0 ? [{ links, title: section.title }] : []
    }) ?? []

  const socialLinks =
    footer.socialLinks?.flatMap((item) => {
      if (!hasText(item?.url)) {
        return []
      }

      return [
        {
          href: item.url,
          label: hasText(item.label) ? item.label : item.platform,
          platform: item.platform,
          ...getExternalLinkProps(item.openInNewTab),
        },
      ]
    }) ?? []

  const contactItems =
    footer.contactItems?.flatMap((item) => {
      if (!hasText(item?.label) || !hasText(item?.value)) {
        return []
      }

      const resolved = resolveFooterLink(args.locale, item.link)

      return [
        {
          href: resolved?.href ?? null,
          label: item.label,
          rel: resolved?.rel,
          target: resolved?.target,
          value: item.value,
        },
      ]
    }) ?? []

  const legalLinks =
    footer.legalLinks?.flatMap((item) => {
      const resolved = resolveFooterLink(args.locale, item?.link)

      if (!hasText(item?.label) || !resolved) {
        return []
      }

      return [
        {
          href: resolved.href,
          label: item.label,
          rel: resolved.rel,
          target: resolved.target,
        },
      ]
    }) ?? []

  const filings =
    footer.compliance?.filings?.flatMap((item) => {
      if (!hasText(item?.label) || !hasText(item?.value)) {
        return []
      }

      return [
        {
          href: hasText(item.href) ? item.href : null,
          label: item.label,
          value: item.value,
        },
      ]
    }) ?? []

  const normalized: NormalizedSiteFooter = {
    brand: {
      description: hasText(footer.brand?.description) ? footer.brand.description : null,
      href: brandLink?.href ?? null,
      logo: footer.brand?.logo ?? null,
      name: hasText(footer.brand?.name) ? footer.brand.name : args.settings.siteName,
      rel: brandLink?.rel,
      supportingText: hasText(footer.brand?.supportingText) ? footer.brand.supportingText : null,
      target: brandLink?.target,
    },
    compliance: {
      copyright: hasText(footer.compliance?.copyright) ? footer.compliance.copyright : null,
      filings,
      note: hasText(footer.bottomBar?.note) ? footer.bottomBar.note : null,
    },
    contactItems,
    legalLinks,
    layoutStyle: resolveSiteFooterLayoutStyle((footer as { layoutStyle?: unknown }).layoutStyle),
    navigationSections,
    socialLinks,
  }

  const hasContent =
    hasBrandContent ||
    navigationSections.length > 0 ||
    socialLinks.length > 0 ||
    contactItems.length > 0 ||
    legalLinks.length > 0 ||
    filings.length > 0 ||
    hasText(normalized.compliance.copyright) ||
    hasText(normalized.compliance.note)

  return hasContent ? normalized : null
}
