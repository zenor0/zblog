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

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'
import type { AppLocale } from '@/lib/locales'
import type { SiteSettings } from '@/lib/site-settings'

import { normalizeSiteFooter } from '@/components/frontend/site-footer'
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
  meta: null | string
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
      meta: null,
      rel: item.rel,
      target: item.target,
    })),
  ]
}

function FooterIdentity(props: { footer: NormalizedSiteFooter }) {
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

      {brand.supportingText ? (
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
              {item.meta ? <span className="editorial-meta">{item.meta}</span> : null}
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

function FooterMetadata(props: { footer: NormalizedSiteFooter }) {
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

export function SiteFooterLayout(props: { className?: string; footer: NormalizedSiteFooter }) {
  return (
    <footer
      className={cn('mt-16 border-t border-border', props.className)}
      data-footer-layout="balanced"
      data-site-footer=""
    >
      <div className="page-frame py-7 sm:py-9">
        <div className="grid gap-5">
          <div
            className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.65fr)]"
            data-footer-layer="directory"
          >
            <FooterIdentity footer={props.footer} />

            <div
              className="grid gap-6 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]"
              data-footer-adaptive-grid="directory"
              data-footer-grid=""
            >
              <FooterNavSections footer={props.footer} />
            </div>
          </div>

          <FooterProfileItems footer={props.footer} />
          <FooterMetadata footer={props.footer} />
        </div>
      </div>
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
