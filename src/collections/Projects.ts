import type { CollectionConfig } from 'payload'

import { editorOnly, publishedOrEditor, publishedVersionsOrEditor } from '@/shared/auth/access'
import { slugify } from '@/shared/content/slugs'
import { defaultLocale } from '@/shared/i18n/locales'

export const projectStatusOptions = [
  {
    label: 'Active',
    value: 'active',
  },
  {
    label: 'Shipped',
    value: 'shipped',
  },
  {
    label: 'Paused',
    value: 'paused',
  },
  {
    label: 'Archived',
    value: 'archived',
  },
]

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: publishedOrEditor,
    readVersions: publishedVersionsOrEditor,
    update: editorOnly,
  },
  admin: {
    defaultColumns: ['title', 'status', 'featured', 'sortOrder', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          id: 'overview',
          label: 'Overview',
          fields: [
            {
              localized: true,
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              localized: true,
              name: 'summary',
              required: true,
              type: 'textarea',
            },
            {
              admin: {
                description:
                  'Short project notes rendered on the project detail page. Keep this lighter than a full article.',
              },
              localized: true,
              name: 'details',
              type: 'textarea',
            },
            {
              name: 'coverImage',
              relationTo: 'media',
              type: 'relationship',
            },
          ],
        },
        {
          id: 'project-metadata',
          label: 'Project Metadata',
          fields: [
            {
              defaultValue: 'active',
              name: 'status',
              options: projectStatusOptions,
              required: true,
              type: 'select',
            },
            {
              admin: {
                description: 'Concise timeline label, for example "2026" or "2025 - ongoing".',
              },
              name: 'timeframe',
              type: 'text',
            },
            {
              defaultValue: false,
              name: 'featured',
              type: 'checkbox',
            },
            {
              admin: {
                description:
                  'Lower numbers appear first. Featured projects still sort before non-featured projects.',
              },
              defaultValue: 0,
              name: 'sortOrder',
              type: 'number',
            },
            {
              name: 'links',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  required: true,
                  type: 'text',
                },
                {
                  name: 'url',
                  required: true,
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'textarea',
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
              fields: [
                {
                  admin: {
                    description:
                      'Optional SEO title override for the current locale. Leave blank to reuse the project title.',
                  },
                  label: 'SEO title',
                  localized: true,
                  maxLength: 70,
                  name: 'metaTitle',
                  type: 'text',
                },
                {
                  admin: {
                    description:
                      'Optional SEO description override for the current locale. Leave blank to reuse the project summary.',
                  },
                  label: 'SEO description',
                  localized: true,
                  maxLength: 180,
                  name: 'metaDescription',
                  type: 'textarea',
                },
                {
                  admin: {
                    description:
                      'Optional social sharing image override. Leave blank to reuse the cover image, then the site default image.',
                  },
                  label: 'Social image',
                  name: 'metaImage',
                  relationTo: 'media',
                  type: 'relationship',
                },
                {
                  admin: {
                    description:
                      'Prevent this locale from appearing in search results or the sitemap. Leave disabled for normal published projects.',
                  },
                  defaultValue: false,
                  label: 'No index',
                  localized: true,
                  name: 'noindex',
                  type: 'checkbox',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      admin: {
        position: 'sidebar',
      },
      index: true,
      name: 'slug',
      required: true,
      type: 'text',
      unique: true,
    },
    {
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'value',
          required: true,
          type: 'text',
        },
      ],
      name: 'tags',
      type: 'array',
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
      name: 'publishedAt',
      type: 'date',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const currentLocale = typeof req.locale === 'string' ? req.locale : defaultLocale
        const title = typeof data.title === 'string' ? data.title : originalDoc?.title

        if ((!data.slug || typeof data.slug !== 'string') && typeof title === 'string') {
          const slug = slugify(title)

          if (slug) {
            data.slug = slug
          }
        }

        if (data._status === 'published' && !originalDoc?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }

        if (!data.slug || typeof data.slug !== 'string') {
          throw new Error(`Locale "${currentLocale}" requires a title or slug before publishing.`)
        }

        return data
      },
    ],
  },
  timestamps: true,
  versions: {
    drafts: {
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
}
