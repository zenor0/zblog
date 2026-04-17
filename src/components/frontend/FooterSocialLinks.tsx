import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

export function FooterSocialLinks(props: { links: NormalizedSiteFooter['socialLinks'] }) {
  if (props.links.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="section-kicker" data-footer-heading="">
        Social
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {props.links.map((item) => (
          <Link className="editorial-link no-underline" href={item.href} key={`${item.platform}-${item.href}`} rel={item.rel} target={item.target}>
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
