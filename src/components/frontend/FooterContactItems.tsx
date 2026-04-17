import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

export function FooterContactItems(props: { items: NormalizedSiteFooter['contactItems'] }) {
  if (props.items.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="section-kicker" data-footer-heading="">
        Contact
      </p>

      <dl className="flex flex-col gap-2">
        {props.items.map((item) => (
          <div className="flex flex-col gap-1" key={`${item.label}-${item.value}`}>
            <dt className="editorial-meta">{item.label}</dt>
            <dd className="text-sm text-foreground/82">
              {item.href ? (
                <Link href={item.href} rel={item.rel} target={item.target}>
                  {item.value}
                </Link>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
