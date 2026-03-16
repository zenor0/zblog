import type { GlobalConfig } from 'payload'

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
      defaultValue: 'ZBlog CMS',
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
          defaultValue: 'ZBlog CMS',
          label: 'Eyebrow',
          localized: true,
        },
        {
          name: 'title',
          type: 'text',
          defaultValue: '多语言文章、引用与版本记录。',
          label: 'Title',
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            '基于 Payload，支持多语言文章、引用、附件与版本历史。界面尽量保持克制、清楚，把注意力留给内容本身。',
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
