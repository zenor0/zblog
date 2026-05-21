import type { CollectionConfig } from 'payload'

import { editorOnly, publishedOrEditor, publishedVersionsOrEditor } from '@/shared/auth/access'
import { defaultLocale } from '@/shared/i18n/locales'
import {
  createPageSlugFromTitle,
  normalizePageSlugInput,
  validatePageSlug,
} from '@/features/pages/model/page-slugs'
import {
  buildPageLivePreviewURL,
  buildPagePreviewURL,
  resolveAdminDocumentID,
} from '@/features/pages/preview'

export { validatePageSlug }

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: publishedOrEditor,
    readVersions: publishedVersionsOrEditor,
    update: editorOnly,
  },
  admin: {
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    livePreview: {
      breakpoints: [
        {
          height: 844,
          label: 'Phone · 390 × 844',
          name: 'phone',
          width: 390,
        },
        {
          height: 900,
          label: 'Desktop · 1440 × 900',
          name: 'desktop',
          width: 1440,
        },
      ],
      url: ({ data, locale }) => {
        const id = resolveAdminDocumentID(data?.id)

        if (id === null) {
          return null
        }

        return buildPageLivePreviewURL({
          id,
          locale,
        })
      },
    },
    preview: (doc, { locale }) => {
      const id = resolveAdminDocumentID(doc?.id)

      if (id === null) {
        return null
      }

      return buildPagePreviewURL({
        id,
        locale,
      })
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          id: 'content',
          label: 'Content',
          fields: [
            {
              localized: true,
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              localized: true,
              name: 'eyebrow',
              type: 'text',
            },
            {
              localized: true,
              name: 'description',
              required: true,
              type: 'textarea',
            },
            {
              admin: {
                description:
                  'Markdown is supported here, including headings, lists, links, tables, code blocks, and GitHub-style callouts via > [!NOTE].',
                language: 'markdown',
              },
              localized: true,
              name: 'content',
              required: true,
              type: 'code',
            },
            {
              localized: true,
              name: 'effectiveDateLabel',
              type: 'text',
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
                      'Optional SEO title override for the current locale. Leave blank to reuse the page title.',
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
                      'Optional SEO description override for the current locale. Leave blank to reuse the page description or body summary.',
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
                      'Optional social sharing image override. Leave blank to reuse the site default image.',
                  },
                  label: 'Social image',
                  name: 'metaImage',
                  relationTo: 'media',
                  type: 'relationship',
                },
                {
                  admin: {
                    description:
                      'Prevent this locale from appearing in search results or the sitemap. Leave disabled for normal published pages.',
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
        description:
          'Single top-level URL segment only, for example "about". Reserved system paths like posts, projects, and archive cannot be used.',
        position: 'sidebar',
      },
      index: true,
      name: 'slug',
      required: true,
      type: 'text',
      unique: true,
      validate: validatePageSlug,
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
    beforeValidate: [
      async ({ data, originalDoc }) => {
        if (!data) {
          return data
        }

        const slug = normalizePageSlugInput(data.slug)
        const originalSlug = normalizePageSlugInput(originalDoc?.slug)

        if (slug) {
          data.slug = slug
        } else if (originalSlug) {
          data.slug = originalSlug
        } else {
          const titleSlug = createPageSlugFromTitle(data.title)

          if (titleSlug) {
            data.slug = titleSlug
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const currentLocale = typeof req.locale === 'string' ? req.locale : defaultLocale
        const slugValidation = validatePageSlug(data.slug ?? originalDoc?.slug)

        if (slugValidation !== true) {
          throw new Error(`Locale "${currentLocale}" has an invalid page slug: ${slugValidation}`)
        }

        if (data._status === 'published' && !originalDoc?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }

        return data
      },
    ],
  },
  timestamps: true,
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
}
