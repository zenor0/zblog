# Footer Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Payload-backed site footer so `site-settings.footer` uses a structured localized schema and the frontend renders the full footer consistently across locales.

**Architecture:** Replace the old footer fields in [`src/globals/SiteSettings.ts`](/home/zenor0/projects/zblog/src/globals/SiteSettings.ts) with explicit `brand`, `navigationSections`, `socialLinks`, `contactItems`, `legalLinks`, `compliance`, and `bottomBar` sections. Add a pure footer normalization layer that resolves locale-aware internal links before refactoring [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx) into smaller presentational units that share the site's editorial styling.

**Tech Stack:** Payload CMS 3, Next.js 15, React 19, TypeScript, Payload globals, Vitest, Testing Library, Playwright-generated frontend shell styles

---

## File Map

- Modify: [`src/globals/SiteSettings.ts`](/home/zenor0/projects/zblog/src/globals/SiteSettings.ts)
  - Replace the old footer schema with structured footer sections and reusable link groups.
- Create: [`src/components/frontend/site-footer.ts`](/home/zenor0/projects/zblog/src/components/frontend/site-footer.ts)
  - Pure helpers for text guards, link resolution, footer normalization, and render-ready footer model types.
- Modify: [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx)
  - Compose the normalized footer model into the final top-level footer layout.
- Create: [`src/components/frontend/FooterBrand.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterBrand.tsx)
  - Render the brand logo, brand name, localized description, supporting text, and optional brand link.
- Create: [`src/components/frontend/FooterNavSections.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterNavSections.tsx)
  - Render navigation groups with link labels and optional descriptions.
- Create: [`src/components/frontend/FooterSocialLinks.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterSocialLinks.tsx)
  - Render outbound social links as a dedicated footer block.
- Create: [`src/components/frontend/FooterContactItems.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterContactItems.tsx)
  - Render localized contact labels and either linked or plain-text values.
- Create: [`src/components/frontend/FooterBottomBar.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterBottomBar.tsx)
  - Render legal links, compliance filings, copyright, and bottom-bar note.
- Modify: [`src/app/(frontend)/[locale]/layout.tsx`](/home/zenor0/projects/zblog/src/app/(frontend)/[locale]/layout.tsx)
  - Pass the active locale into `SiteFooter` so internal footer links can be localized.
- Modify: [`src/app/(frontend)/[locale]/posts/[slug]/page.tsx`](/home/zenor0/projects/zblog/src/app/(frontend)/[locale]/posts/[slug]/page.tsx)
  - Replace the removed `footer.owner` fallback with the new brand-name fallback when building article structured data.
- Modify: [`src/app/(frontend)/styles.css`](/home/zenor0/projects/zblog/src/app/(frontend)/styles.css)
  - Add footer-specific editorial layout styles for the new sections.
- Modify: [`src/payload-types.ts`](/home/zenor0/projects/zblog/src/payload-types.ts)
  - Regenerated after the schema change.
- Modify: [`src/app/(payload)/admin/importMap.js`](/home/zenor0/projects/zblog/src/app/(payload)/admin/importMap.js)
  - Regenerated after creating/modifying components.
- Create: [`tests/int/site-settings-footer-config.int.spec.ts`](/home/zenor0/projects/zblog/tests/int/site-settings-footer-config.int.spec.ts)
  - Assert the new footer global schema shape.
- Create: [`tests/int/site-footer-model.int.spec.ts`](/home/zenor0/projects/zblog/tests/int/site-footer-model.int.spec.ts)
  - Assert link resolution, section normalization, and footer fallback rules.
- Create: [`tests/int/site-footer.int.spec.tsx`](/home/zenor0/projects/zblog/tests/int/site-footer.int.spec.tsx)
  - Assert brand, navigation, social, contact, and bottom-bar rendering.

### Task 1: Replace the footer global schema

**Files:**
- Modify: [`src/globals/SiteSettings.ts`](/home/zenor0/projects/zblog/src/globals/SiteSettings.ts)
- Test: [`tests/int/site-settings-footer-config.int.spec.ts`](/home/zenor0/projects/zblog/tests/int/site-settings-footer-config.int.spec.ts)

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from 'vitest'

import { SiteSettings } from '@/globals/SiteSettings'

describe('Site settings footer config', () => {
  it('defines the rebuilt footer groups and reusable link shape', () => {
    const footerField = SiteSettings.fields.find((field: any) => field.name === 'footer') as any

    expect(footerField.type).toBe('group')
    expect(footerField.fields.map((field: any) => field.name)).toEqual([
      'brand',
      'navigationSections',
      'socialLinks',
      'contactItems',
      'legalLinks',
      'compliance',
      'bottomBar',
    ])

    const brandField = footerField.fields.find((field: any) => field.name === 'brand') as any
    expect(brandField.fields.map((field: any) => field.name)).toEqual([
      'logo',
      'name',
      'description',
      'supportingText',
      'link',
    ])

    const brandLinkField = brandField.fields.find((field: any) => field.name === 'link') as any
    expect(brandLinkField.fields.map((field: any) => field.name)).toEqual([
      'type',
      'internalPath',
      'externalUrl',
      'openInNewTab',
    ])

    const socialLinksField = footerField.fields.find((field: any) => field.name === 'socialLinks') as any
    expect(socialLinksField.fields.map((field: any) => field.name)).toEqual([
      'platform',
      'label',
      'url',
      'openInNewTab',
    ])
  })
})
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-settings-footer-config.int.spec.ts
```

Expected: FAIL because `SiteSettings.footer` still exposes `note`, `owner`, `records`, and `links` instead of the new structured sections.

- [ ] **Step 3: Implement the new footer schema in `SiteSettings`**

```ts
import type { Field, GlobalConfig } from 'payload'

function footerLinkField(args: { label: string; name?: string; required?: boolean }): Field {
  return {
    name: args.name ?? 'link',
    type: 'group',
    label: args.label,
    fields: [
      {
        name: 'type',
        type: 'radio',
        defaultValue: 'internal',
        options: [
          { label: 'Internal path', value: 'internal' },
          { label: 'External URL', value: 'external' },
        ],
        required: true,
      },
      {
        name: 'internalPath',
        type: 'text',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'internal',
          description: 'Enter a locale-agnostic path such as /posts or /about.',
        },
        validate: (value, { siblingData }) => {
          if (args.required === true && siblingData?.type === 'internal' && typeof value !== 'string') {
            return 'Internal path is required.'
          }

          return true
        },
      },
      {
        name: 'externalUrl',
        type: 'text',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'external',
        },
        validate: (value, { siblingData }) => {
          if (args.required === true && siblingData?.type === 'external' && typeof value !== 'string') {
            return 'External URL is required.'
          }

          return true
        },
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        defaultValue: false,
        label: 'Open in new tab',
      },
    ],
  }
}

const footerFields: Field[] = [
  {
    name: 'brand',
    type: 'group',
    fields: [
      {
        name: 'logo',
        type: 'relationship',
        relationTo: 'media',
      },
      { name: 'name', type: 'text', localized: true },
      { name: 'description', type: 'textarea', localized: true },
      { name: 'supportingText', type: 'textarea', localized: true },
      footerLinkField({ label: 'Brand link' }),
    ],
  },
  {
    name: 'navigationSections',
    type: 'array',
    fields: [
      { name: 'title', type: 'text', localized: true, required: true },
      {
        name: 'links',
        type: 'array',
        fields: [
          { name: 'label', type: 'text', localized: true, required: true },
          { name: 'description', type: 'text', localized: true },
          footerLinkField({ label: 'Destination', required: true }),
        ],
      },
    ],
  },
  {
    name: 'socialLinks',
    type: 'array',
    fields: [
      {
        name: 'platform',
        type: 'select',
        options: ['github', 'x', 'linkedin', 'youtube', 'instagram', 'discord', 'rss', 'email', 'other'],
        required: true,
      },
      { name: 'label', type: 'text', localized: true },
      { name: 'url', type: 'text', required: true },
      { name: 'openInNewTab', type: 'checkbox', defaultValue: true },
    ],
  },
  {
    name: 'contactItems',
    type: 'array',
    fields: [
      { name: 'label', type: 'text', localized: true, required: true },
      { name: 'value', type: 'text', localized: true, required: true },
      footerLinkField({ label: 'Optional link' }),
    ],
  },
  {
    name: 'legalLinks',
    type: 'array',
    fields: [
      { name: 'label', type: 'text', localized: true, required: true },
      footerLinkField({ label: 'Destination', required: true }),
    ],
  },
  {
    name: 'compliance',
    type: 'group',
    fields: [
      { name: 'copyright', type: 'text', localized: true },
      {
        name: 'filings',
        type: 'array',
        fields: [
          { name: 'label', type: 'text', localized: true, required: true },
          { name: 'value', type: 'text', localized: true, required: true },
          { name: 'href', type: 'text' },
        ],
      },
    ],
  },
  {
    name: 'bottomBar',
    type: 'group',
    fields: [{ name: 'note', type: 'textarea', localized: true }],
  },
]
```

- [ ] **Step 4: Re-run the schema test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-settings-footer-config.int.spec.ts
```

Expected: PASS with 1 passing test in `site-settings-footer-config.int.spec.ts`.

- [ ] **Step 5: Regenerate Payload types for the new schema**

Run:

```bash
PAYLOAD_SECRET=test-secret pnpm run generate:types
```

Expected: PASS with updated footer types in `src/payload-types.ts`.

- [ ] **Step 6: Commit the schema task**

```bash
git add tests/int/site-settings-footer-config.int.spec.ts src/globals/SiteSettings.ts src/payload-types.ts
git commit -m "feat: rebuild site footer schema"
```

### Task 2: Add footer normalization and link resolution helpers

**Files:**
- Create: [`src/components/frontend/site-footer.ts`](/home/zenor0/projects/zblog/src/components/frontend/site-footer.ts)
- Test: [`tests/int/site-footer-model.int.spec.ts`](/home/zenor0/projects/zblog/tests/int/site-footer-model.int.spec.ts)

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from 'vitest'

import { normalizeSiteFooter, resolveFooterLink } from '@/components/frontend/site-footer'

describe('site footer model helpers', () => {
  it('resolves internal and external footer links', () => {
    expect(
      resolveFooterLink('en', {
        type: 'internal',
        internalPath: '/posts',
        openInNewTab: false,
      }),
    ).toEqual({
      href: '/en/posts',
      isExternal: false,
      rel: undefined,
      target: undefined,
    })

    expect(
      resolveFooterLink('zh-Hans', {
        type: 'external',
        externalUrl: 'https://github.com/zenor0/zblog',
        openInNewTab: true,
      }),
    ).toEqual({
      href: 'https://github.com/zenor0/zblog',
      isExternal: true,
      rel: 'noreferrer',
      target: '_blank',
    })
  })

  it('falls back to siteName and drops empty footer sections', () => {
    const footer = normalizeSiteFooter({
      locale: 'en',
      settings: {
        siteName: 'ZBlog',
        footer: {
          brand: {
            name: '',
            description: 'Editorial notes and product writing.',
            supportingText: null,
          },
          navigationSections: [
            {
              title: 'Read',
              links: [
                {
                  label: 'Posts',
                  description: '',
                  link: { type: 'internal', internalPath: '/posts', openInNewTab: false },
                },
              ],
            },
            {
              title: '',
              links: [],
            },
          ],
          socialLinks: [{ platform: 'github', label: 'GitHub', openInNewTab: true, url: 'https://github.com/zenor0' }],
          contactItems: [{ label: 'Email', value: 'hi@example.com', link: null }],
          legalLinks: [],
          compliance: { copyright: '© 2026 ZBlog', filings: [] },
          bottomBar: { note: '' },
        },
      } as any,
    })

    expect(footer?.brand.name).toBe('ZBlog')
    expect(footer?.navigationSections).toHaveLength(1)
    expect(footer?.socialLinks[0]?.href).toBe('https://github.com/zenor0')
    expect(footer?.contactItems[0]?.value).toBe('hi@example.com')
    expect(footer?.legalLinks).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the helper tests to verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-footer-model.int.spec.ts
```

Expected: FAIL because `@/components/frontend/site-footer` does not exist yet.

- [ ] **Step 3: Implement the pure footer helper module**

```ts
import type { AppLocale } from '@/lib/locales'
import type { SiteSettings } from '@/lib/site-settings'

import { buildLocalePath } from '@/lib/locales'

type FooterData = NonNullable<SiteSettings['footer']>
type FooterLinkData = NonNullable<NonNullable<FooterData['brand']>['link']>

export type ResolvedFooterLink = {
  href: string
  isExternal: boolean
  rel?: string
  target?: string
}

export type NormalizedSiteFooter = {
  brand: {
    description: null | string
    href: null | string
    logo: FooterData['brand']['logo']
    name: string
    rel?: string
    supportingText: null | string
    target?: string
  }
  contactItems: {
    href: null | string
    label: string
    rel?: string
    target?: string
    value: string
  }[]
  legalLinks: {
    href: string
    label: string
    rel?: string
    target?: string
  }[]
  navigationSections: {
    links: {
      description: null | string
      href: string
      label: string
      rel?: string
      target?: string
    }[]
    title: string
  }[]
  socialLinks: {
    href: string
    label: string
    platform: string
    rel?: string
    target?: string
  }[]
  compliance: {
    copyright: null | string
    filings: {
      href: null | string
      label: string
      value: string
    }[]
    note: null | string
  }
}

export function hasText(value: null | string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function resolveFooterLink(locale: AppLocale, link: FooterLinkData | null | undefined): null | ResolvedFooterLink {
  if (!link) return null

  if (link.type === 'internal' && hasText(link.internalPath)) {
    return { href: buildLocalePath(locale, link.internalPath), isExternal: false }
  }

  if (link.type === 'external' && hasText(link.externalUrl)) {
    return {
      href: link.externalUrl,
      isExternal: true,
      rel: 'noreferrer',
      target: link.openInNewTab ? '_blank' : undefined,
    }
  }

  return null
}

export function normalizeSiteFooter(args: { locale: AppLocale; settings: SiteSettings }): null | NormalizedSiteFooter {
  const footer = args.settings.footer
  if (!footer) return null

  const navigationSections =
    footer.navigationSections?.flatMap((section) => {
      if (!hasText(section?.title)) return []

      const links =
        section.links?.flatMap((item) => {
          const resolved = resolveFooterLink(args.locale, item?.link as FooterLinkData | null | undefined)
          if (!hasText(item?.label) || !resolved) return []

          return [
            {
              description: hasText(item.description) ? item.description : null,
              href: resolved.href,
              label: item.label,
              rel: resolved.rel,
              target: resolved.target,
            },
          ]
        }) ?? []

      return links.length ? [{ title: section.title, links }] : []
    }) ?? []

  const socialLinks =
    footer.socialLinks?.flatMap((item) =>
      hasText(item?.url)
        ? [
            {
              href: item.url,
              label: hasText(item.label) ? item.label : item.platform,
              platform: item.platform,
              rel: 'noreferrer',
              target: item.openInNewTab ? '_blank' : undefined,
            },
          ]
        : [],
    ) ?? []

  const contactItems =
    footer.contactItems?.flatMap((item) => {
      if (!hasText(item?.label) || !hasText(item?.value)) return []

      const resolved = resolveFooterLink(args.locale, item.link as FooterLinkData | null | undefined)

      return [
        {
          href: resolved?.href ?? null,
          label: item.label,
          rel: resolved?.rel,
          target: resolved?.target,
          value: item.value,
        },
      ]
    }) ?? []

  const legalLinks =
    footer.legalLinks?.flatMap((item) => {
      const resolved = resolveFooterLink(args.locale, item?.link as FooterLinkData | null | undefined)
      if (!hasText(item?.label) || !resolved) return []

      return [{ href: resolved.href, label: item.label, rel: resolved.rel, target: resolved.target }]
    }) ?? []

  const filings =
    footer.compliance?.filings?.flatMap((item) =>
      hasText(item?.label) && hasText(item?.value)
        ? [{ href: hasText(item.href) ? item.href : null, label: item.label, value: item.value }]
        : [],
    ) ?? []

  const brandLink = resolveFooterLink(args.locale, footer.brand?.link as FooterLinkData | null | undefined)
  const brandName = hasText(footer.brand?.name) ? footer.brand.name : args.settings.siteName
  const hasBrandContent =
    footer.brand?.logo != null ||
    hasText(footer.brand?.name) ||
    hasText(footer.brand?.description) ||
    hasText(footer.brand?.supportingText) ||
    brandLink != null
  const normalized: NormalizedSiteFooter = {
    brand: {
      description: hasText(footer.brand?.description) ? footer.brand.description : null,
      href: brandLink?.href ?? null,
      logo: footer.brand?.logo ?? null,
      name: brandName,
      rel: brandLink?.rel,
      supportingText: hasText(footer.brand?.supportingText) ? footer.brand.supportingText : null,
      target: brandLink?.target,
    },
    compliance: {
      copyright: hasText(footer.compliance?.copyright) ? footer.compliance.copyright : null,
      filings,
      note: hasText(footer.bottomBar?.note) ? footer.bottomBar.note : null,
    },
    contactItems,
    legalLinks,
    navigationSections,
    socialLinks,
  }

  const hasContent =
    hasBrandContent ||
    hasText(normalized.brand.description) ||
    normalized.navigationSections.length > 0 ||
    normalized.socialLinks.length > 0 ||
    normalized.contactItems.length > 0 ||
    normalized.legalLinks.length > 0 ||
    normalized.compliance.filings.length > 0 ||
    hasText(normalized.compliance.copyright) ||
    hasText(normalized.compliance.note)

  return hasContent ? normalized : null
}
```

- [ ] **Step 4: Re-run the helper tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-footer-model.int.spec.ts
```

Expected: PASS with 2 passing tests in `site-footer-model.int.spec.ts`.

- [ ] **Step 5: Commit the helper task**

```bash
git add tests/int/site-footer-model.int.spec.ts src/components/frontend/site-footer.ts
git commit -m "test: add site footer helpers"
```

### Task 3: Rebuild the frontend footer and wire locale-aware callers

**Files:**
- Modify: [`src/components/frontend/SiteFooter.tsx`](/home/zenor0/projects/zblog/src/components/frontend/SiteFooter.tsx)
- Create: [`src/components/frontend/FooterBrand.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterBrand.tsx)
- Create: [`src/components/frontend/FooterNavSections.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterNavSections.tsx)
- Create: [`src/components/frontend/FooterSocialLinks.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterSocialLinks.tsx)
- Create: [`src/components/frontend/FooterContactItems.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterContactItems.tsx)
- Create: [`src/components/frontend/FooterBottomBar.tsx`](/home/zenor0/projects/zblog/src/components/frontend/FooterBottomBar.tsx)
- Modify: [`src/app/(frontend)/[locale]/layout.tsx`](/home/zenor0/projects/zblog/src/app/(frontend)/[locale]/layout.tsx)
- Modify: [`src/app/(frontend)/[locale]/posts/[slug]/page.tsx`](/home/zenor0/projects/zblog/src/app/(frontend)/[locale]/posts/[slug]/page.tsx)
- Modify: [`src/app/(frontend)/styles.css`](/home/zenor0/projects/zblog/src/app/(frontend)/styles.css)
- Test: [`tests/int/site-footer.int.spec.tsx`](/home/zenor0/projects/zblog/tests/int/site-footer.int.spec.tsx)

- [ ] **Step 1: Write the failing footer render test**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from '@/components/frontend/SiteFooter'

describe('SiteFooter', () => {
  it('renders the brand, navigation, social, contact, and bottom-bar sections', () => {
    const markup = renderToStaticMarkup(
      <SiteFooter
        locale="en"
        settings={
          {
            siteName: 'ZBlog',
            footer: {
              brand: {
                name: 'ZBlog Studio',
                description: 'Essays on software and product work.',
                supportingText: 'Independent writing practice.',
                link: { type: 'internal', internalPath: '/', openInNewTab: false },
              },
              navigationSections: [
                {
                  title: 'Explore',
                  links: [
                    {
                      label: 'Posts',
                      description: 'All published writing',
                      link: { type: 'internal', internalPath: '/posts', openInNewTab: false },
                    },
                  ],
                },
              ],
              socialLinks: [{ platform: 'github', label: 'GitHub', openInNewTab: true, url: 'https://github.com/zenor0' }],
              contactItems: [{ label: 'Email', value: 'hi@example.com', link: null }],
              legalLinks: [
                {
                  label: 'Privacy',
                  link: { type: 'external', externalUrl: 'https://example.com/privacy', openInNewTab: true },
                },
              ],
              compliance: {
                copyright: '© 2026 ZBlog',
                filings: [{ label: 'ICP', value: '沪ICP备00000000号', href: 'https://beian.miit.gov.cn/' }],
              },
              bottomBar: { note: 'Built with Payload and Next.js.' },
            },
          } as any
        }
      />,
    )

    expect(markup).toContain('ZBlog Studio')
    expect(markup).toContain('Essays on software and product work.')
    expect(markup).toContain('/en/posts')
    expect(markup).toContain('GitHub')
    expect(markup).toContain('hi@example.com')
    expect(markup).toContain('Privacy')
    expect(markup).toContain('沪ICP备00000000号')
    expect(markup).toContain('Built with Payload and Next.js.')
  })

  it('renders nothing when the normalized footer has no usable content', () => {
    const markup = renderToStaticMarkup(<SiteFooter locale="en" settings={{ siteName: 'ZBlog', footer: null } as any} />)

    expect(markup).toBe('')
  })
})
```

- [ ] **Step 2: Run the footer render test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-footer.int.spec.tsx
```

Expected: FAIL because `SiteFooter` still expects the old footer shape and does not accept a `locale` prop.

- [ ] **Step 3: Implement the rebuilt footer components and caller updates**

```tsx
// src/components/frontend/SiteFooter.tsx
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
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            <FooterNavSections sections={footer.navigationSections} />
            <FooterSocialLinks links={footer.socialLinks} />
            <FooterContactItems items={footer.contactItems} />
          </div>
        </div>

        <FooterBottomBar
          compliance={footer.compliance}
          legalLinks={footer.legalLinks}
        />
      </div>
    </footer>
  )
}
```

```tsx
// src/components/frontend/FooterBrand.tsx
import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

export function FooterBrand(props: { brand: NormalizedSiteFooter['brand'] }) {
  const content = (
    <div className="flex flex-col gap-3">
      <p className="section-kicker">{props.brand.name}</p>
      {props.brand.description ? <p className="max-w-xl font-serif text-2xl leading-9">{props.brand.description}</p> : null}
      {props.brand.supportingText ? <p className="max-w-lg text-sm leading-7 text-muted-foreground">{props.brand.supportingText}</p> : null}
    </div>
  )

  return props.brand.href ? (
    <Link href={props.brand.href} rel={props.brand.rel} target={props.brand.target}>
      {content}
    </Link>
  ) : (
    content
  )
}

// src/components/frontend/FooterBottomBar.tsx
import Link from 'next/link'

import type { NormalizedSiteFooter } from '@/components/frontend/site-footer'

export function FooterBottomBar(props: Pick<NormalizedSiteFooter, 'compliance' | 'legalLinks'>) {
  return (
    <div className="data-[footer-bottom]:grid" data-footer-bottom="">
      {props.legalLinks.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {props.legalLinks.map((item) => (
            <Link href={item.href} key={item.label} rel={item.rel} target={item.target}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {props.compliance.filings.length ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {props.compliance.filings.map((item) => (
            <div className="flex gap-2" key={`${item.label}-${item.value}`}>
              <dt>{item.label}</dt>
              <dd>{item.href ? <Link href={item.href}>{item.value}</Link> : item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {props.compliance.copyright ? <p>{props.compliance.copyright}</p> : null}
      {props.compliance.note ? <p>{props.compliance.note}</p> : null}
    </div>
  )
}
```

```tsx
// src/app/(frontend)/[locale]/layout.tsx
<SiteFooter locale={locale} settings={siteSettings} />
```

```ts
// src/app/(frontend)/[locale]/posts/[slug]/page.tsx
authorName: siteSettings.footer?.brand?.name || siteSettings.siteName,
```

```css
/* src/app/(frontend)/styles.css */
[data-site-footer] [data-footer-heading] {
  @apply editorial-meta mb-3;
}

[data-site-footer] [data-footer-grid] {
  @apply grid gap-8 border-t border-border pt-6;
}

[data-site-footer] [data-footer-link-description] {
  @apply mt-1 text-sm leading-6 text-muted-foreground;
}

[data-site-footer] [data-footer-bottom] {
  @apply mt-10 grid gap-4 border-t border-border pt-6 text-sm text-muted-foreground;
}
```

- [ ] **Step 4: Re-run the focused footer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/site-footer-model.int.spec.ts tests/int/site-footer.int.spec.tsx
```

Expected: PASS with all footer helper and render tests green.

- [ ] **Step 5: Commit the frontend footer task**

```bash
git add \
  tests/int/site-footer.int.spec.tsx \
  src/components/frontend/site-footer.ts \
  src/components/frontend/SiteFooter.tsx \
  src/components/frontend/FooterBrand.tsx \
  src/components/frontend/FooterNavSections.tsx \
  src/components/frontend/FooterSocialLinks.tsx \
  src/components/frontend/FooterContactItems.tsx \
  src/components/frontend/FooterBottomBar.tsx \
  'src/app/(frontend)/[locale]/layout.tsx' \
  'src/app/(frontend)/[locale]/posts/[slug]/page.tsx' \
  'src/app/(frontend)/styles.css'
git commit -m "feat: rebuild frontend site footer"
```

### Task 4: Regenerate generated artifacts and run verification

**Files:**
- Modify: [`src/payload-types.ts`](/home/zenor0/projects/zblog/src/payload-types.ts)
- Modify: [`src/app/(payload)/admin/importMap.js`](/home/zenor0/projects/zblog/src/app/(payload)/admin/importMap.js)

- [ ] **Step 1: Regenerate the Payload import map**

Run:

```bash
PAYLOAD_SECRET=test-secret pnpm run generate:importmap
```

Expected: PASS with refreshed component import mappings in `src/app/(payload)/admin/importMap.js`.

- [ ] **Step 2: Run TypeScript verification**

Run:

```bash
PAYLOAD_SECRET=test-secret pnpm exec tsc --noEmit
```

Expected: PASS with no type errors after the footer schema and component changes.

- [ ] **Step 3: Run the focused integration suite**

Run:

```bash
PAYLOAD_SECRET=test-secret pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/site-settings-footer-config.int.spec.ts \
  tests/int/site-footer-model.int.spec.ts \
  tests/int/site-footer.int.spec.tsx \
  tests/int/locales.int.spec.ts
```

Expected: PASS with all footer-specific and locale-path tests green.

- [ ] **Step 4: Run the full integration suite**

Run:

```bash
PAYLOAD_SECRET=test-secret pnpm run test:int
```

Expected: PASS

- [ ] **Step 5: Commit the verification task**

```bash
git add src/app/(payload)/admin/importMap.js
git commit -m "chore: verify footer rebuild"
```
