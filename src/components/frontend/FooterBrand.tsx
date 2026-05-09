import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

function renderBrandContent(brand: NormalizedSiteFooter['brand']) {
  return (
    <div className="flex flex-col gap-3">
      {brand.logo &&
      typeof brand.logo === 'object' &&
      'url' in brand.logo &&
      typeof brand.logo.url === 'string' ? (
        <img
          alt={brand.logo.alt || brand.name}
          className="h-10 w-auto object-contain"
          height={40}
          src={brand.logo.url}
          width={160}
        />
      ) : null}

      <p className="section-kicker">{brand.name}</p>

      {brand.description ? (
        <p className="max-w-xl font-serif text-xl leading-8 text-foreground/90 sm:text-2xl">
          {brand.description}
        </p>
      ) : null}

      {brand.supportingText ? (
        <p className="max-w-lg text-sm leading-7 text-muted-foreground">{brand.supportingText}</p>
      ) : null}
    </div>
  )
}

export function FooterBrand(props: { brand: NormalizedSiteFooter['brand'] }) {
  const content = renderBrandContent(props.brand)

  if (!props.brand.href) {
    return content
  }

  return (
    <Link
      className="block no-underline"
      href={props.brand.href}
      rel={props.brand.rel}
      target={props.brand.target}
    >
      {content}
    </Link>
  )
}
