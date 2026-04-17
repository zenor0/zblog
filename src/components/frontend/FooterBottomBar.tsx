import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

export function FooterBottomBar(props: Pick<NormalizedSiteFooter, 'compliance' | 'legalLinks'>) {
  const { compliance, legalLinks } = props
  const hasBottomContent =
    legalLinks.length > 0 ||
    compliance.filings.length > 0 ||
    Boolean(compliance.copyright) ||
    Boolean(compliance.note)

  if (!hasBottomContent) {
    return null
  }

  return (
    <div className="mt-10 grid gap-4 border-t border-border pt-6 text-sm text-muted-foreground" data-footer-bottom="">
      {legalLinks.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {legalLinks.map((item) => (
            <Link className="editorial-link no-underline" href={item.href} key={`${item.label}-${item.href}`} rel={item.rel} target={item.target}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {compliance.filings.length ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {compliance.filings.map((item) => (
            <div className="flex gap-2" key={`${item.label}-${item.value}`}>
              <dt className="editorial-meta">{item.label}</dt>
              <dd>
                {item.href ? <Link href={item.href}>{item.value}</Link> : item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {compliance.copyright ? <p>{compliance.copyright}</p> : null}
      {compliance.note ? <p>{compliance.note}</p> : null}
    </div>
  )
}
