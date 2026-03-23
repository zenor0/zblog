import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
    <footer className="mt-12 border-t border-border/70">
      <div className="page-frame py-8 sm:py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <p className="section-kicker">{settings.siteName}</p>
              {hasText(note) ? (
                <p className="font-serif text-xl leading-8 tracking-[-0.02em] text-foreground/88 sm:text-2xl">
                  {note}
                </p>
              ) : null}
            </div>

            {metaItems.length ? (
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {metaItems.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </div>

          {records.length ? (
            <div className="flex flex-wrap gap-2">
              {records.map((item) => {
                const content = (
                  <Badge variant="outline">
                    {item.label}: {item.value}
                  </Badge>
                )

                return hasText(item.href) ? (
                  <Link
                    href={item.href}
                    key={item.id ?? `${item.label}-${item.value}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={item.id ?? `${item.label}-${item.value}`}>{content}</div>
                )
              })}
            </div>
          ) : null}

          {links.length ? (
            <>
              <Separator />
              <div className="flex flex-wrap gap-1">
                {links.map((item) => (
                  <Button
                    asChild
                    className="px-0"
                    key={item.id ?? `${item.label}-${item.href}`}
                    size="sm"
                    variant="link"
                  >
                    <Link href={item.href} rel="noreferrer" target="_blank">
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
