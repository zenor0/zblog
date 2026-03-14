import Link from 'next/link'

import type { SiteSettings } from '@/lib/site-settings'

function hasText(value: null | string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function SiteFooter(props: {
  settings: SiteSettings
}) {
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
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        {hasText(note) ? <p className="site-footer__note">{note}</p> : null}

        {metaItems.length ? (
          <p className="site-footer__meta">
            {metaItems.map((item, index) => (
              <span key={item}>
                {index > 0 ? <span className="site-footer__separator">·</span> : null}
                {item}
              </span>
            ))}
          </p>
        ) : null}

        {records.length ? (
          <ul className="site-footer__list">
            {records.map((item) => {
              const content = (
                <>
                  <span className="site-footer__label">{item.label}</span>
                  <span>{item.value}</span>
                </>
              )

              return (
                <li key={item.id ?? `${item.label}-${item.value}`}>
                  {hasText(item.href) ? (
                    <Link href={item.href} rel="noreferrer" target="_blank">
                      {content}
                    </Link>
                  ) : (
                    <span>{content}</span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}

        {links.length ? (
          <ul className="site-footer__links">
            {links.map((item) => (
              <li key={item.id ?? `${item.label}-${item.href}`}>
                <Link href={item.href} rel="noreferrer" target="_blank">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  )
}
