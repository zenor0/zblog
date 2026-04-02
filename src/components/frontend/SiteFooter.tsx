import Link from 'next/link'

import type { SiteSettings } from '@/lib/site-settings'

function hasText(value: null | string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function SiteFooter(props: { settings: SiteSettings }) {
  const { settings } = props
  const note = hasText(settings.footer?.note) ? settings.footer.note : null
  const owner = settings.footer?.owner
  const copyright = hasText(settings.footer?.copyright)
    ? settings.footer.copyright
    : `© ${new Date().getFullYear()} ${settings.siteName}`
  const records = (settings.footer?.records ?? []).filter(
    (item) => hasText(item?.label) && hasText(item?.value),
  )
  const links = (settings.footer?.links ?? []).filter(
    (item) => hasText(item?.label) && hasText(item?.href),
  )
  const metaItems = [owner, copyright].filter(hasText)
  const hasFooterContent = Boolean(note || metaItems.length || records.length || links.length)

  if (!hasFooterContent) {
    return null
  }

  return (
    <footer className="mt-16 border-t border-border" data-site-footer="">
      <div className="page-frame py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex flex-col gap-3">
            <p className="section-kicker">{settings.siteName}</p>
            {hasText(note) ? (
              <p className="max-w-2xl font-serif text-2xl leading-9 tracking-[-0.025em] text-foreground/90 sm:text-3xl">
                {note}
              </p>
            ) : null}
          </div>

          {metaItems.length ? (
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
        </div>

        {records.length ? (
          <dl className="mt-8 grid gap-x-8 gap-y-3 border-t border-border pt-6 sm:grid-cols-2">
            {records.map((item) => {
              const value = hasText(item.href) ? (
                <Link href={item.href} rel="noreferrer" target="_blank">
                  {item.value}
                </Link>
              ) : (
                item.value
              )

              return (
                <div
                  className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
                  key={item.id ?? `${item.label}-${item.value}`}
                >
                  <dt className="editorial-meta">{item.label}</dt>
                  <dd className="text-sm text-foreground/82">{value}</dd>
                </div>
              )
            })}
          </dl>
        ) : null}

        {links.length ? (
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6">
            {links.map((item) => (
              <Link
                className="editorial-link no-underline"
                href={item.href}
                key={item.id ?? `${item.label}-${item.href}`}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  )
}
