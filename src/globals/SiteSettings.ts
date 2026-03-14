import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: {
    plural: '站点设置',
    singular: '站点设置',
  },
  admin: {
    description: '配置首页头版文案以及前台底部展示的备案、版权和链接信息。',
    group: 'Frontend',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'ZBlog CMS',
      label: '站点名称',
      required: true,
    },
    {
      name: 'homeHero',
      type: 'group',
      label: '首页头版',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          defaultValue: 'ZBlog CMS',
          label: '眉题',
          localized: true,
        },
        {
          name: 'title',
          type: 'text',
          defaultValue: '多语言文章、引用与版本记录。',
          label: '标题',
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue:
            '基于 Payload，支持多语言文章、引用、附件与版本历史。界面尽量保持克制、清楚，把注意力留给内容本身。',
          label: '说明',
          localized: true,
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      label: '页脚',
      fields: [
        {
          name: 'note',
          type: 'textarea',
          label: '说明文字',
          localized: true,
        },
        {
          name: 'owner',
          type: 'text',
          label: '主体名称',
        },
        {
          name: 'copyright',
          type: 'text',
          admin: {
            placeholder: '© 2026 ZBlog',
          },
          label: '版权信息',
        },
        {
          name: 'records',
          type: 'array',
          label: '备案/登记信息',
          labels: {
            plural: '备案/登记信息',
            singular: '备案/登记项',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: '名称',
              localized: true,
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              label: '内容',
              required: true,
            },
            {
              name: 'href',
              type: 'text',
              label: '链接',
            },
          ],
        },
        {
          name: 'links',
          type: 'array',
          label: '页脚链接',
          labels: {
            plural: '页脚链接',
            singular: '页脚链接',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              label: '名称',
              localized: true,
              required: true,
            },
            {
              name: 'href',
              type: 'text',
              label: '链接',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
