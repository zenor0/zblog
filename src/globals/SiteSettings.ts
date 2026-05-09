import type { Field, GlobalConfig } from 'payload'

import {
  articleLayoutCJKFontOptions,
  articleLayoutCodeFontOptions,
  articleLayoutHeadingFontOptions,
  articleLayoutLatinFontOptions,
  articleLayoutPresetOptions,
  defaultArticleLayoutPresetID,
  validateArticleLayoutLength,
  validateArticleLayoutLineHeight,
} from '@/lib/article-layout'
import {
  defaultSiteFooterLayoutStyle,
  siteFooterLayoutStyleOptions,
} from '@/lib/site-footer-layout'

const localizedHeroDefaults = {
  en: {
    description: 'A simple blog for articles, notes, and project updates.',
    eyebrow: 'Personal Blog',
    siteDescription: 'A bilingual blog about tech, products, and everyday work.',
    title: 'Notes on tech, products, and everyday work',
  },
  'zh-Hans': {
    description: '这里会持续发布文章、笔记和项目更新。',
    eyebrow: '个人博客',
    siteDescription: '一个持续记录技术、产品与日常工作的双语博客。',
    title: '记录技术、产品与日常思考',
  },
} as const

function getLocalizedHeroDefault(
  locale: null | string | undefined,
  field: keyof (typeof localizedHeroDefaults)['zh-Hans'],
) {
  const normalizedLocale = locale === 'en' ? 'en' : 'zh-Hans'

  return localizedHeroDefaults[normalizedLocale][field]
}

const footerSocialPlatformOptions = [
  'github',
  'x',
  'linkedin',
  'youtube',
  'instagram',
  'discord',
  'rss',
  'email',
  'other',
] as const

function validateFooterLinkValue(
  value: unknown,
  args: {
    field: 'externalUrl' | 'internalPath'
    required?: boolean
    siblingData?: {
      type?: string
    }
  },
) {
  const expectsValue =
    args.required === true &&
    ((args.field === 'internalPath' && args.siblingData?.type === 'internal') ||
      (args.field === 'externalUrl' && args.siblingData?.type === 'external'))

  if (!expectsValue) {
    return true
  }

  return typeof value === 'string' && value.trim().length > 0
    ? true
    : args.field === 'internalPath'
      ? 'Internal path is required.'
      : 'External URL is required.'
}

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
        label: 'Link type',
        options: [
          {
            label: 'Internal path',
            value: 'internal',
          },
          {
            label: 'External URL',
            value: 'external',
          },
        ],
        required: true,
      },
      {
        name: 'internalPath',
        type: 'text',
        label: 'Internal path',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'internal',
          description: 'Enter a locale-agnostic path such as /posts or /about.',
        },
        validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) =>
          validateFooterLinkValue(value, {
            field: 'internalPath',
            required: args.required,
            siblingData,
          }),
      },
      {
        name: 'externalUrl',
        type: 'text',
        label: 'External URL',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'external',
        },
        validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) =>
          validateFooterLinkValue(value, {
            field: 'externalUrl',
            required: args.required,
            siblingData,
          }),
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
    name: 'layoutStyle',
    type: 'select',
    admin: {
      description:
        'Controls the frontend footer layout. Preview every option under /dev/footer-layouts.',
    },
    defaultValue: defaultSiteFooterLayoutStyle,
    label: 'Layout style',
    options: siteFooterLayoutStyleOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    required: true,
  },
  {
    name: 'brand',
    type: 'group',
    label: 'Brand',
    fields: [
      {
        name: 'logo',
        type: 'relationship',
        relationTo: 'media',
        label: 'Logo',
      },
      {
        name: 'name',
        type: 'text',
        label: 'Brand name',
        localized: true,
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Brand description',
        localized: true,
      },
      {
        name: 'supportingText',
        type: 'textarea',
        label: 'Supporting text',
        localized: true,
      },
      footerLinkField({
        label: 'Brand link',
      }),
    ],
  },
  {
    name: 'navigationSections',
    type: 'array',
    label: 'Navigation sections',
    labels: {
      plural: 'Navigation sections',
      singular: 'Navigation section',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
        localized: true,
        required: true,
      },
      {
        name: 'links',
        type: 'array',
        label: 'Links',
        labels: {
          plural: 'Links',
          singular: 'Link',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            label: 'Label',
            localized: true,
            required: true,
          },
          {
            name: 'description',
            type: 'text',
            label: 'Description',
            localized: true,
          },
          footerLinkField({
            label: 'Destination',
            required: true,
          }),
        ],
      },
    ],
  },
  {
    name: 'socialLinks',
    type: 'array',
    label: 'Social links',
    labels: {
      plural: 'Social links',
      singular: 'Social link',
    },
    fields: [
      {
        name: 'platform',
        type: 'select',
        label: 'Platform',
        options: footerSocialPlatformOptions.map((value) => ({
          label: value,
          value,
        })),
        required: true,
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
      },
      {
        name: 'url',
        type: 'text',
        label: 'URL',
        required: true,
      },
      {
        name: 'openInNewTab',
        type: 'checkbox',
        defaultValue: true,
        label: 'Open in new tab',
      },
    ],
  },
  {
    name: 'contactItems',
    type: 'array',
    label: 'Contact items',
    labels: {
      plural: 'Contact items',
      singular: 'Contact item',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
        required: true,
      },
      {
        name: 'value',
        type: 'text',
        label: 'Value',
        localized: true,
        required: true,
      },
      footerLinkField({
        label: 'Optional link',
      }),
    ],
  },
  {
    name: 'legalLinks',
    type: 'array',
    label: 'Legal links',
    labels: {
      plural: 'Legal links',
      singular: 'Legal link',
    },
    fields: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        localized: true,
        required: true,
      },
      footerLinkField({
        label: 'Destination',
        required: true,
      }),
    ],
  },
  {
    name: 'compliance',
    type: 'group',
    label: 'Compliance',
    fields: [
      {
        name: 'copyright',
        type: 'text',
        label: 'Copyright',
        localized: true,
      },
      {
        name: 'filings',
        type: 'array',
        label: 'Compliance filings',
        labels: {
          plural: 'Compliance filings',
          singular: 'Compliance filing',
        },
        fields: [
          {
            name: 'label',
            type: 'text',
            label: 'Label',
            localized: true,
            required: true,
          },
          {
            name: 'value',
            type: 'text',
            label: 'Value',
            localized: true,
            required: true,
          },
          {
            name: 'href',
            type: 'text',
            label: 'Link',
          },
        ],
      },
    ],
  },
  {
    name: 'bottomBar',
    type: 'group',
    label: 'Bottom bar',
    fields: [
      {
        name: 'note',
        type: 'textarea',
        label: 'Note',
        localized: true,
      },
    ],
  },
]

const articleLayoutFields: Field[] = [
  {
    type: 'row',
    admin: {
      className: 'article-layout-settings-grid',
    },
    fields: [
      {
        type: 'collapsible',
        admin: {
          className: 'article-layout-settings__controls',
          initCollapsed: false,
        },
        fields: [
          {
            name: 'preset',
            type: 'select',
            admin: {
              description:
                'Choose the default reading rhythm for public article pages. Dense is the current preferred baseline.',
            },
            defaultValue: defaultArticleLayoutPresetID,
            label: 'Preset',
            options: articleLayoutPresetOptions,
            required: true,
          },
          {
            name: 'typography',
            type: 'group',
            admin: {
              description:
                'Optional font stack overrides. Leave blank to inherit the selected layout preset.',
              width: '100%',
            },
            fields: [
              {
                name: 'latinFont',
                type: 'select',
                admin: {
                  description: 'Western text font stack.',
                  width: '50%',
                },
                label: 'Latin font',
                options: [...articleLayoutLatinFontOptions],
              },
              {
                name: 'cjkFont',
                type: 'select',
                admin: {
                  description: 'Chinese/Japanese/Korean fallback stack.',
                  width: '50%',
                },
                label: 'CJK font',
                options: [...articleLayoutCJKFontOptions],
              },
              {
                name: 'headingFont',
                type: 'select',
                admin: {
                  description: 'Heading font stack.',
                  width: '50%',
                },
                label: 'Heading font',
                options: [...articleLayoutHeadingFontOptions],
              },
              {
                name: 'codeFont',
                type: 'select',
                admin: {
                  description: 'Inline and block code font stack.',
                  width: '50%',
                },
                label: 'Code font',
                options: [...articleLayoutCodeFontOptions],
              },
            ],
            label: 'Typography',
          },
          {
            name: 'advanced',
            type: 'group',
            admin: {
              description:
                'Optional safe CSS token overrides. Leave blank to use the selected preset values.',
              width: '100%',
            },
            fields: [
              {
                name: 'contentWidth',
                type: 'text',
                admin: {
                  description:
                    'Controls both the reading column and prose max width, such as 76ch.',
                  width: '50%',
                },
                label: 'Content width',
                validate: validateArticleLayoutLength,
              },
              {
                name: 'bodyFontSize',
                type: 'text',
                admin: {
                  description: 'Body text size, such as 0.98rem or 17px.',
                  width: '50%',
                },
                label: 'Body font size',
                validate: validateArticleLayoutLength,
              },
              {
                name: 'bodyLineHeight',
                type: 'text',
                admin: {
                  description: 'Unitless body line-height ratio, such as 1.65.',
                  width: '50%',
                },
                label: 'Body line height',
                validate: validateArticleLayoutLineHeight,
              },
              {
                name: 'paragraphGap',
                type: 'text',
                admin: {
                  description: 'Vertical gap between consecutive paragraphs, such as 0.75rem.',
                  width: '50%',
                },
                label: 'Paragraph gap',
                validate: validateArticleLayoutLength,
              },
              {
                name: 'flowGap',
                type: 'text',
                admin: {
                  description: 'Default vertical flow gap between ordinary article elements.',
                  width: '50%',
                },
                label: 'Flow gap',
                validate: validateArticleLayoutLength,
              },
              {
                name: 'blockGap',
                type: 'text',
                admin: {
                  description: 'Outer vertical gap for figures, tables, code blocks, and callouts.',
                  width: '50%',
                },
                label: 'Rich block gap',
                validate: validateArticleLayoutLength,
              },
              {
                name: 'captionGap',
                type: 'text',
                admin: {
                  description: 'Internal gap between media/table surfaces and their captions.',
                  width: '50%',
                },
                label: 'Caption gap',
                validate: validateArticleLayoutLength,
              },
              {
                name: 'gridGap',
                type: 'text',
                admin: {
                  description:
                    'Desktop gap between the reading column and the table of contents rail.',
                  width: '50%',
                },
                label: 'Reading grid gap',
                validate: validateArticleLayoutLength,
              },
            ],
            label: 'Advanced overrides',
          },
        ],
        label: 'Layout controls',
      },
      {
        name: 'preview',
        type: 'ui',
        admin: {
          components: {
            Field: '/components/payload/ArticleLayoutPreview#ArticleLayoutPreview',
          },
        },
      },
    ],
  },
]

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    description:
      'Configure the homepage hero copy and the structured footer content shown on the frontend.',
    group: 'Frontend',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          id: 'general',
          label: 'General',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              defaultValue: 'ZBlog',
              label: 'Site name',
              required: true,
            },
            {
              name: 'siteDescription',
              type: 'textarea',
              defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'siteDescription'),
              label: 'Site description',
              localized: true,
            },
          ],
        },
        {
          id: 'homepage',
          label: 'Homepage',
          fields: [
            {
              name: 'homeHero',
              type: 'group',
              label: 'Homepage hero',
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                  defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'eyebrow'),
                  label: 'Eyebrow',
                  localized: true,
                },
                {
                  name: 'title',
                  type: 'text',
                  defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'title'),
                  label: 'Title',
                  localized: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                  defaultValue: ({ locale }) => getLocalizedHeroDefault(locale, 'description'),
                  label: 'Description',
                  localized: true,
                },
              ],
            },
          ],
        },
        {
          id: 'seo',
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: 'SEO & sharing',
              fields: [
                {
                  name: 'homeTitle',
                  type: 'text',
                  admin: {
                    description:
                      'Optional SEO title override for the localized homepage. Leave blank to reuse the homepage hero title.',
                  },
                  localized: true,
                  maxLength: 70,
                  label: 'Homepage SEO title',
                },
                {
                  name: 'homeDescription',
                  type: 'textarea',
                  admin: {
                    description:
                      'Optional SEO description override for the localized homepage. Leave blank to reuse the site description.',
                  },
                  localized: true,
                  maxLength: 180,
                  label: 'Homepage SEO description',
                },
                {
                  name: 'defaultSocialImage',
                  type: 'relationship',
                  relationTo: 'media',
                  label: 'Default social image',
                },
              ],
            },
          ],
        },
        {
          id: 'article-layout',
          label: 'Article layout',
          fields: [
            {
              name: 'articleLayout',
              type: 'group',
              admin: {
                description:
                  'Configure the default article reading layout preset and a small set of safe spacing overrides.',
              },
              label: 'Article layout',
              fields: articleLayoutFields,
            },
          ],
        },
        {
          id: 'footer',
          label: 'Footer',
          fields: [
            {
              name: 'footer',
              type: 'group',
              label: 'Footer',
              fields: footerFields,
            },
          ],
        },
      ],
    },
  ],
}
