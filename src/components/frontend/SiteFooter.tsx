import type { AppLocale } from '@/lib/locales'
import type { SiteSettings } from '@/lib/site-settings'

import { FooterBottomBar } from '@/components/frontend/FooterBottomBar'
import { FooterBrand } from '@/components/frontend/FooterBrand'
import { FooterContactItems } from '@/components/frontend/FooterContactItems'
import { FooterNavSections } from '@/components/frontend/FooterNavSections'
import { FooterSocialLinks } from '@/components/frontend/FooterSocialLinks'
import { normalizeSiteFooter } from '@/components/frontend/site-footer'

export function SiteFooter(props: { locale: AppLocale; settings: SiteSettings }) {
  const footer = normalizeSiteFooter(props)

  if (!footer) {
    return null
  }

  return (
    <footer className="mt-16 border-t border-border" data-site-footer="">
      <div className="page-frame py-10 sm:py-14">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
          <FooterBrand brand={footer.brand} />

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3" data-footer-grid="">
            <FooterNavSections sections={footer.navigationSections} />
            <FooterSocialLinks links={footer.socialLinks} />
            <FooterContactItems items={footer.contactItems} />
          </div>
        </div>

        <FooterBottomBar compliance={footer.compliance} legalLinks={footer.legalLinks} />
      </div>
    </footer>
  )
}
