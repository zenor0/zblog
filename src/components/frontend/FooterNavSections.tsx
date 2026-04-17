import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

export function FooterNavSections(props: { sections: NormalizedSiteFooter['navigationSections'] }) {
  if (props.sections.length === 0) {
    return null
  }

  return (
    <>
      {props.sections.map((section) => (
        <section className="flex flex-col gap-3" key={section.title}>
          <p className="section-kicker" data-footer-heading="">
            {section.title}
          </p>

          <div className="flex flex-col gap-3">
            {section.links.map((item) => (
              <div className="flex flex-col gap-1" key={`${section.title}-${item.label}-${item.href}`}>
                <Link className="editorial-link no-underline" href={item.href} rel={item.rel} target={item.target}>
                  {item.label}
                </Link>
                {item.description ? (
                  <p className="text-sm leading-6 text-muted-foreground" data-footer-link-description="">
                    {item.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
