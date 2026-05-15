import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import type { SiteSettings } from '@/features/site-settings/model/site-settings'

import { footerLayoutCandidates } from '@/app/(frontend)/dev/footer-layouts/footerLayoutCandidates'
import { SiteFooterLayout } from '@/features/site-settings/ui/SiteFooter'
import {
  normalizeSiteFooter,
  siteFooterLayoutStyleOptions,
} from '@/features/site-settings/model/site-footer'
import { defaultSiteName } from '@/shared/site/defaults'

export const metadata: Metadata = {
  title: 'Footer Layouts',
  robots: { index: false, follow: false },
}

const footerLayoutPreviewSettings = {
  id: 0,
  siteName: defaultSiteName,
  articleLayout: {
    preset: 'current',
  },
  footer: {
    layoutStyle: 'compact',
    brand: {
      name: defaultSiteName,
      description: '技术、产品与日常工作的长期记录。',
      supportingText: 'Independent writing practice.',
      link: { type: 'internal', internalPath: '/', openInNewTab: false },
    },
    navigationSections: [
      {
        title: '阅读',
        links: [
          {
            label: '文章',
            link: { type: 'internal', internalPath: '/posts', openInNewTab: false },
          },
          {
            label: '归档',
            link: { type: 'internal', internalPath: '/archive', openInNewTab: false },
          },
        ],
      },
      {
        title: '关于',
        links: [
          {
            label: '关于本站',
            link: { type: 'internal', internalPath: '/about', openInNewTab: false },
          },
          {
            label: '项目',
            link: { type: 'internal', internalPath: '/projects', openInNewTab: false },
          },
        ],
      },
    ],
    socialLinks: [
      {
        platform: 'github',
        label: 'Project updates',
        openInNewTab: true,
        url: 'https://github.com/payloadcms/payload',
      },
    ],
    contactItems: [],
    legalLinks: [
      {
        label: '隐私政策',
        link: { type: 'internal', internalPath: '/privacy', openInNewTab: false },
      },
      {
        label: '使用条款',
        link: { type: 'internal', internalPath: '/terms', openInNewTab: false },
      },
    ],
    compliance: {
      copyright: `Copyright 2026 ${defaultSiteName}. All rights reserved.`,
      filings: [
        {
          href: 'https://beian.miit.gov.cn/',
          label: 'ICP备案',
          value: '沪ICP备00000000号-1',
        },
        {
          href: 'https://beian.mps.gov.cn/',
          label: '公安备案',
          value: '沪公网安备 00000000000000号',
        },
      ],
    },
    bottomBar: {
      note: 'Maintained by the site editor.',
    },
  },
} as SiteSettings

const footerLayoutOptionValues = siteFooterLayoutStyleOptions.map((option) => option.value)

export default function FooterLayoutLabPage() {
  const previewFooter = normalizeSiteFooter({
    locale: 'zh-Hans',
    settings: footerLayoutPreviewSettings,
  })

  if (!previewFooter) {
    return null
  }

  return (
    <div className="page-frame frontend-shell dev-reference-shell">
      <header className="dev-reference-hero">
        <Link className="editorial-link inline-flex items-center gap-2 text-sm" href="/dev">
          <ArrowLeft aria-hidden="true" />
          返回开发索引
        </Link>
        <div className="flex max-w-4xl flex-col gap-4">
          <p className="section-kicker">Footer Layouts</p>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
            用真实 footer 字段对比信息型排版。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-foreground/72 sm:text-lg">
            /dev/footer-layouts 集中预览四个可配置方案。内容都来自同一组 footer
            配置字段，选择后只需要在 Site Settings 里切换布局样式。
          </p>
        </div>
      </header>

      <section className="grid gap-8">
        {footerLayoutCandidates.map((candidate, index) => (
          <article
            className="grid gap-4 border border-border bg-background p-4 sm:p-5"
            key={candidate.layoutStyle}
          >
            <div className="grid gap-2 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
              <div className="flex flex-col gap-1">
                <p className="section-kicker">{footerLayoutOptionValues[index]}</p>
                <h2 className="text-xl font-medium leading-7">{candidate.title}</h2>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {candidate.description}
              </p>
            </div>

            <SiteFooterLayout
              className="mt-0"
              footer={{ ...previewFooter, layoutStyle: candidate.layoutStyle }}
            />
          </article>
        ))}
      </section>
    </div>
  )
}
