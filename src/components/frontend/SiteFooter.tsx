import Link from 'next/link'
import {
  AtSign,
  ExternalLink,
  Github,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Rss,
  UserRound,
  Youtube,
  type LucideIcon,
} from 'lucide-react'

import type { NormalizedSiteFooter, SiteFooterLayoutStyle } from '@/components/frontend/site-footer'
import type { AppLocale } from '@/lib/locales'
import type { SiteSettings } from '@/lib/site-settings'

import {
  normalizeSiteFooter,
  resolveSiteFooterLayoutStyle,
} from '@/components/frontend/site-footer'
import { cn } from '@/lib/utils'

type FooterInlineItem = {
  href: null | string
  label: string
  rel?: string
  target?: string
}

type FooterProfileItem = FooterInlineItem & {
  icon: LucideIcon
  iconKey: string
  meta: string
}

const socialPlatformIcons: Record<string, LucideIcon> = {
  discord: MessageCircle,
  email: Mail,
  github: Github,
  instagram: Instagram,
  linkedin: Linkedin,
  other: ExternalLink,
  rss: Rss,
  x: AtSign,
  youtube: Youtube,
}

function FooterTextLink(props: FooterInlineItem & { className?: string }) {
  if (!props.href) {
    return <span className={cn('text-foreground/82', props.className)}>{props.label}</span>
  }

  return (
    <Link
      className={cn('editorial-link no-underline', props.className)}
      href={props.href}
      rel={props.rel}
      target={props.target}
    >
      {props.label}
    </Link>
  )
}

function getNavigationLinks(footer: NormalizedSiteFooter): FooterInlineItem[] {
  return footer.navigationSections.flatMap((section) =>
    section.links.map((item) => ({
      href: item.href,
      label: item.label,
      rel: item.rel,
      target: item.target,
    })),
  )
}

function getUtilityItems(footer: NormalizedSiteFooter): FooterInlineItem[] {
  return [
    ...getNavigationLinks(footer),
    ...footer.socialLinks.map((item) => ({
      href: item.href,
      label: item.label,
      rel: item.rel,
      target: item.target,
    })),
    ...footer.contactItems.map((item) => ({
      href: item.href,
      label: item.value,
      rel: item.rel,
      target: item.target,
    })),
    ...footer.legalLinks.map((item) => ({
      href: item.href,
      label: item.label,
      rel: item.rel,
      target: item.target,
    })),
  ]
}

function getProfileItems(footer: NormalizedSiteFooter): FooterProfileItem[] {
  return [
    ...footer.contactItems.map((item) => ({
      href: item.href,
      icon: item.label.toLowerCase().includes('email') ? Mail : UserRound,
      iconKey: item.label.toLowerCase().includes('email') ? 'email' : 'contact',
      label: item.value,
      meta: item.label,
      rel: item.rel,
      target: item.target,
    })),
    ...footer.socialLinks.map((item) => ({
      href: item.href,
      icon: socialPlatformIcons[String(item.platform)] ?? ExternalLink,
      iconKey: String(item.platform),
      label: item.label,
      meta: String(item.platform),
      rel: item.rel,
      target: item.target,
    })),
  ]
}

function FooterIdentity(props: { footer: NormalizedSiteFooter; showSupportingText?: boolean }) {
  const { brand } = props.footer
  const content = (
    <div className="flex min-w-0 flex-col gap-2">
      {brand.logo &&
      typeof brand.logo === 'object' &&
      'url' in brand.logo &&
      typeof brand.logo.url === 'string' ? (
        <img
          alt={brand.logo.alt || brand.name}
          className="h-8 w-auto object-contain"
          height={32}
          src={brand.logo.url}
          width={128}
        />
      ) : null}

      <p className="text-sm font-medium leading-6 text-foreground">{brand.name}</p>

      {brand.description ? (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{brand.description}</p>
      ) : null}

      {props.showSupportingText && brand.supportingText ? (
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{brand.supportingText}</p>
      ) : null}
    </div>
  )

  if (!brand.href) {
    return content
  }

  return (
    <Link className="block no-underline" href={brand.href} rel={brand.rel} target={brand.target}>
      {content}
    </Link>
  )
}

function FooterMetadata(props: { className?: string; footer: NormalizedSiteFooter }) {
  const { compliance } = props.footer
  const hasMetadata =
    compliance.filings.length > 0 || Boolean(compliance.copyright) || Boolean(compliance.note)

  if (!hasMetadata) {
    return null
  }

  return (
    <div
      className={cn('flex flex-col gap-2 text-sm leading-6 text-muted-foreground', props.className)}
      data-footer-meta=""
    >
      {compliance.filings.length ? (
        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          {compliance.filings.map((item) => (
            <div className="flex flex-wrap gap-x-1.5" key={`${item.label}-${item.value}`}>
              <dt>{item.label}</dt>
              <dd>{item.href ? <Link href={item.href}>{item.value}</Link> : item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {compliance.copyright || compliance.note ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {compliance.copyright ? <p>{compliance.copyright}</p> : null}
          {compliance.note ? <p>{compliance.note}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function FooterInlineItems(props: { className?: string; items: FooterInlineItem[] }) {
  if (props.items.length === 0) {
    return null
  }

  const className = cn('flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6', props.className)
  const content = props.items.map((item) => (
    <FooterTextLink key={`${item.label}-${item.href ?? 'plain'}`} {...item} />
  ))

  if (props.items.every((item) => item.href)) {
    return (
      <nav aria-label="Footer links" className={className}>
        {content}
      </nav>
    )
  }

  return (
    <div className={className} data-footer-inline-items="">
      {content}
    </div>
  )
}

function FooterNavSections(props: { footer: NormalizedSiteFooter }) {
  if (props.footer.navigationSections.length === 0) {
    return null
  }

  return (
    <>
      {props.footer.navigationSections.map((section) => (
        <section className="flex flex-col gap-2" key={section.title}>
          <p className="section-kicker" data-footer-heading="">
            {section.title}
          </p>
          <div className="flex flex-col gap-2 text-sm leading-6">
            {section.links.map((item) => (
              <FooterTextLink
                href={item.href}
                key={`${section.title}-${item.label}-${item.href}`}
                label={item.label}
                rel={item.rel}
                target={item.target}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function FooterContactRecords(props: { footer: NormalizedSiteFooter }) {
  if (props.footer.contactItems.length === 0) {
    return null
  }

  return (
    <dl className="flex flex-col gap-2 text-sm leading-6">
      {props.footer.contactItems.map((item) => (
        <div className="grid gap-0.5" key={`${item.label}-${item.value}`}>
          <dt className="editorial-meta">{item.label}</dt>
          <dd>
            <FooterTextLink
              href={item.href}
              label={item.value}
              rel={item.rel}
              target={item.target}
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function FooterProfileItems(props: { footer: NormalizedSiteFooter }) {
  const items = getProfileItems(props.footer)

  if (items.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Owner profile links"
      className="grid gap-4 border-t border-border py-5 sm:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]"
      data-footer-adaptive-grid="profile"
      data-footer-layer="profile"
    >
      {items.map((item) => {
        const Icon = item.icon
        const content = (
          <>
            <Icon
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              data-footer-icon={item.iconKey}
            />
            <span className="grid min-w-0 gap-0.5">
              <span className="editorial-meta">{item.meta}</span>
              <span className="break-words text-sm leading-6 text-foreground">{item.label}</span>
            </span>
          </>
        )

        if (item.href) {
          return (
            <Link
              className="flex min-w-0 gap-3 no-underline"
              href={item.href}
              key={`${item.meta}-${item.label}-${item.href}`}
              rel={item.rel}
              target={item.target}
            >
              {content}
            </Link>
          )
        }

        return (
          <div className="flex min-w-0 gap-3" key={`${item.meta}-${item.label}`}>
            {content}
          </div>
        )
      })}
    </section>
  )
}

function BalancedFooterMetadata(props: { footer: NormalizedSiteFooter }) {
  const { compliance, legalLinks } = props.footer
  const hasLeftContent = legalLinks.length > 0 || compliance.filings.length > 0
  const hasRightContent = Boolean(compliance.copyright) || Boolean(compliance.note)

  if (!hasLeftContent && !hasRightContent) {
    return null
  }

  return (
    <div
      className="grid gap-4 border-t border-border pt-5 text-sm leading-6 text-muted-foreground lg:grid-cols-[minmax(0,1fr)_minmax(16rem,auto)]"
      data-footer-layer="metadata"
    >
      {hasLeftContent ? (
        <div className="flex flex-col gap-2" data-footer-meta-align="left">
          <FooterInlineItems items={legalLinks} />

          {compliance.filings.length ? (
            <dl className="flex flex-wrap gap-x-5 gap-y-1">
              {compliance.filings.map((item) => (
                <div className="flex flex-wrap gap-x-1.5" key={`${item.label}-${item.value}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.href ? <Link href={item.href}>{item.value}</Link> : item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      {hasRightContent ? (
        <div
          className="flex flex-col gap-1 lg:items-end lg:text-right"
          data-footer-meta-align="right"
        >
          {compliance.copyright ? <p>{compliance.copyright}</p> : null}
          {compliance.note ? <p>{compliance.note}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function DirectoryFooter(props: { footer: NormalizedSiteFooter }) {
  const secondaryLinks: FooterInlineItem[] = [
    ...props.footer.socialLinks.map((item) => ({
      href: item.href,
      label: item.label,
      rel: item.rel,
      target: item.target,
    })),
    ...props.footer.legalLinks.map((item) => ({
      href: item.href,
      label: item.label,
      rel: item.rel,
      target: item.target,
    })),
  ]

  return (
    <div className="page-frame py-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.65fr)]">
        <FooterIdentity footer={props.footer} showSupportingText />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-footer-grid="">
          <FooterNavSections footer={props.footer} />

          {secondaryLinks.length ? (
            <section aria-label="Footer utility links" className="flex flex-col gap-2">
              <FooterInlineItems className="flex-col items-start gap-x-0" items={secondaryLinks} />
            </section>
          ) : null}

          <section aria-label="Footer contact information">
            <FooterContactRecords footer={props.footer} />
          </section>
        </div>
      </div>

      <FooterMetadata className="mt-8 border-t border-border pt-5" footer={props.footer} />
    </div>
  )
}

function BalancedFooter(props: { footer: NormalizedSiteFooter }) {
  return (
    <div className="page-frame py-7 sm:py-9">
      <div className="grid gap-5">
        <div
          className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.65fr)]"
          data-footer-layer="directory"
        >
          <FooterIdentity footer={props.footer} showSupportingText />

          <div
            className="grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]"
            data-footer-adaptive-grid="directory"
            data-footer-grid=""
          >
            <FooterNavSections footer={props.footer} />
          </div>
        </div>

        <FooterProfileItems footer={props.footer} />
        <BalancedFooterMetadata footer={props.footer} />
      </div>
    </div>
  )
}

function CompactFooter(props: { footer: NormalizedSiteFooter }) {
  return (
    <div className="page-frame py-6 sm:py-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <FooterIdentity footer={props.footer} />
          <FooterInlineItems className="lg:justify-end" items={getUtilityItems(props.footer)} />
        </div>

        <FooterMetadata className="border-t border-border pt-4" footer={props.footer} />
      </div>
    </div>
  )
}

function LedgerFooter(props: { footer: NormalizedSiteFooter }) {
  const ledgerLinks = [
    ...props.footer.legalLinks,
    ...getNavigationLinks(props.footer),
    ...props.footer.socialLinks.map((item) => ({
      href: item.href,
      label: item.label,
      rel: item.rel,
      target: item.target,
    })),
  ]

  return (
    <div className="page-frame py-6 sm:py-8">
      <div className="grid gap-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <FooterIdentity footer={props.footer} />
          <FooterInlineItems className="lg:justify-end" items={ledgerLinks} />
        </div>

        {props.footer.contactItems.length ? (
          <div className="border-t border-border pt-4">
            <FooterContactRecords footer={props.footer} />
          </div>
        ) : null}

        <FooterMetadata className="border-t border-border pt-4" footer={props.footer} />
      </div>
    </div>
  )
}

export function SiteFooterLayout(props: {
  className?: string
  footer: NormalizedSiteFooter
  layoutStyle?: SiteFooterLayoutStyle
}) {
  const layoutStyle = resolveSiteFooterLayoutStyle(props.layoutStyle ?? props.footer.layoutStyle)

  return (
    <footer
      className={cn('mt-16 border-t border-border', props.className)}
      data-footer-layout={layoutStyle}
      data-site-footer=""
    >
      {layoutStyle === 'directory' ? <DirectoryFooter footer={props.footer} /> : null}
      {layoutStyle === 'ledger' ? <LedgerFooter footer={props.footer} /> : null}
      {layoutStyle === 'balanced' ? <BalancedFooter footer={props.footer} /> : null}
      {layoutStyle === 'compact' ? <CompactFooter footer={props.footer} /> : null}
    </footer>
  )
}

export function SiteFooter(props: { locale: AppLocale; settings: SiteSettings }) {
  const footer = normalizeSiteFooter(props)

  if (!footer) {
    return null
  }

  return <SiteFooterLayout footer={footer} />
}
