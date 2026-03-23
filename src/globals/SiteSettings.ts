import type { GlobalConfig } from 'payload'

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

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    description: 'Configure the homepage hero copy and the footer records, copyright, and links shown on the frontend.',
    group: 'Frontend',
  },
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
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      fields: [
        {
          name: 'note',
          type: 'textarea',
          label: 'Note',
          localized: true,
        },
        {
          name: 'owner',
          type: 'text',
          label: 'Owner name',
        },
        {
          name: 'copyright',
          type: 'text',
          admin: {
            placeholder: '© 2026 ZBlog',
          },
          label: 'Copyright',
        },
        {
          name: 'records',
          type: 'array',
          label: 'Records',
          labels: {
            plural: 'Records',
            singular: 'Record',
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
              required: true,
            },
            {
              name: 'href',
              type: 'text',
              label: 'Link',
            },
          ],
        },
        {
          name: 'links',
          type: 'array',
          label: 'Footer links',
          labels: {
            plural: 'Footer links',
            singular: 'Footer link',
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
              name: 'href',
              type: 'text',
              label: 'Link',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
