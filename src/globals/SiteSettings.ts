import type { GlobalConfig } from 'payload'

const localizedHeroDefaults = {
  en: {
    description: 'A simple blog for articles, notes, and project updates.',
    eyebrow: 'Personal Blog',
    title: 'Notes on tech, products, and everyday work',
  },
  'zh-Hans': {
    description: '这里会持续发布文章、笔记和项目更新。',
    eyebrow: '个人博客',
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
