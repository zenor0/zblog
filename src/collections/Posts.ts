import type { CollectionConfig, Where } from 'payload'

import { autoTranslatePostEndpoint } from '@/endpoints/posts/autoTranslatePost'
import { captureOwnedResourcesBeforeDelete } from '@/hooks/posts/captureOwnedResourcesBeforeDelete'
import { deleteOwnedResourcesAfterDelete } from '@/hooks/posts/deleteOwnedResourcesAfterDelete'
import { editorOnly, publishedOrEditor, publishedVersionsOrEditor } from '@/lib/access'
import { loadBibliographyEntries } from '@/lib/bibliography'
import { extractCitationKeys } from '@/lib/citations'
import { defaultLocale } from '@/lib/locales'
import { buildPostLivePreviewURL, buildPostPreviewURL } from '@/lib/preview'
import { slugify } from '@/lib/slugs'

function resolveAdminDocumentID(value: unknown) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return null
}

function sharedOrCurrentPostOwnedFilter({ id }: { id?: number | string }): Where {
  if (typeof id !== 'number' && typeof id !== 'string') {
    return {
      ownerPost: {
        exists: false,
      },
    }
  }

  return {
    or: [
      {
        ownerPost: {
          exists: false,
        },
      },
      {
        ownerPost: {
          equals: id,
        },
      },
    ],
  }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: publishedOrEditor,
    readVersions: publishedVersionsOrEditor,
    update: editorOnly,
  },
  admin: {
    components: {
      edit: {
        beforeDocumentControls: [
          '/components/payload/PostPackageImportAction#PostPackageImportAction',
          '/components/payload/TranslateLocaleAction#TranslateLocaleAction',
        ],
      },
      views: {
        edit: {
          livePreview: {
            Component: '/components/payload/PostLivePreviewView#PostLivePreviewView',
          },
        },
      },
    },
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
          height: 390,
          label: 'Phone Wide · 844 × 390',
          name: 'phone-wide',
          width: 844,
        },
        {
          height: 1112,
          label: 'Tablet · 834 × 1112',
          name: 'tablet',
          width: 834,
        },
        {
          height: 834,
          label: 'Tablet Wide · 1112 × 834',
          name: 'tablet-wide',
          width: 1112,
        },
        {
          height: 800,
          label: 'Laptop · 1280 × 800',
          name: 'laptop',
          width: 1280,
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

        return buildPostLivePreviewURL({
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

      return buildPostPreviewURL({
        id,
        locale,
      })
    },
    useAsTitle: 'title',
  },
  endpoints: [autoTranslatePostEndpoint],
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Edit',
          fields: [
            {
              label: 'Core Content',
              type: 'collapsible',
              fields: [
                {
                  localized: true,
                  name: 'title',
                  required: true,
                  type: 'text',
                },
                {
                  localized: true,
                  name: 'excerpt',
                  type: 'textarea',
                },
                {
                  admin: {
                    description:
                      'Markdown is supported here, including blockquotes, fenced code, tables, GitHub-style callouts via > [!NOTE], and citations via [@citation-key].',
                    language: 'markdown',
                  },
                  localized: true,
                  name: 'content',
                  required: true,
                  type: 'code',
                },
              ],
            },
            {
              label: 'Assets & References',
              type: 'collapsible',
              fields: [
                {
                  filterOptions: sharedOrCurrentPostOwnedFilter,
                  name: 'heroImage',
                  relationTo: 'media',
                  type: 'relationship',
                },
                {
                  admin: {
                    description:
                      'Store one BibTeX source directly on this post. Structured editing is available for safe, common entries.',
                    components: {
                      Field: '/components/payload/BibliographyField#BibliographyField',
                    },
                  },
                  name: 'bibliography',
                  type: 'group',
                  fields: [
                    {
                      admin: {
                        description: 'Optional original filename for the BibTeX source stored on this post.',
                      },
                      name: 'filename',
                      type: 'text',
                    },
                    {
                      admin: {
                        description:
                          'Paste BibTeX source here. Citation keys used in the current locale content are validated against this text.',
                        language: 'plaintext',
                      },
                      name: 'source',
                      type: 'code',
                    },
                  ],
                },
                {
                  name: 'attachments',
                  type: 'array',
                  fields: [
                    {
                      filterOptions: sharedOrCurrentPostOwnedFilter,
                      name: 'file',
                      relationTo: 'media',
                      required: true,
                      type: 'relationship',
                    },
                    {
                      name: 'label',
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
              admin: {
                initCollapsed: true,
              },
              label: 'Translation',
              type: 'collapsible',
              fields: [
                {
                  localized: true,
                  name: 'translationStatus',
                  type: 'select',
                  defaultValue: 'original',
                  options: [
                    {
                      label: 'Original',
                      value: 'original',
                    },
                    {
                      label: 'Machine translated',
                      value: 'machine',
                    },
                    {
                      label: 'Human reviewed',
                      value: 'reviewed',
                    },
                  ],
                },
                {
                  admin: {
                    initCollapsed: true,
                  },
                  label: 'Translation metadata',
                  type: 'collapsible',
                  fields: [
                    {
                      admin: {
                        readOnly: true,
                      },
                      localized: true,
                      name: 'translatedFromLocale',
                      type: 'text',
                    },
                    {
                      admin: {
                        date: {
                          pickerAppearance: 'dayAndTime',
                        },
                        readOnly: true,
                      },
                      localized: true,
                      name: 'translatedAt',
                      type: 'date',
                    },
                    {
                      admin: {
                        readOnly: true,
                      },
                      localized: true,
                      name: 'translationProvider',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
            {
              admin: {
                initCollapsed: true,
              },
              label: 'SEO',
              type: 'collapsible',
              fields: [
                {
                  name: 'seo',
                  type: 'group',
                  fields: [
                    {
                      name: 'metaTitle',
                      type: 'text',
                      admin: {
                        description:
                          'Optional SEO title override for the current locale. Leave blank to reuse the post title.',
                      },
                      localized: true,
                      maxLength: 70,
                      label: 'SEO title',
                    },
                    {
                      name: 'metaDescription',
                      type: 'textarea',
                      admin: {
                        description:
                          'Optional SEO description override for the current locale. Leave blank to reuse the excerpt or a summary derived from the post body.',
                      },
                      localized: true,
                      maxLength: 180,
                      label: 'SEO description',
                    },
                    {
                      admin: {
                        description:
                          'Optional social sharing image override. Leave blank to reuse the hero image, then the site default image.',
                      },
                      filterOptions: sharedOrCurrentPostOwnedFilter,
                      name: 'metaImage',
                      relationTo: 'media',
                      type: 'relationship',
                      label: 'Social image',
                    },
                    {
                      name: 'noindex',
                      type: 'checkbox',
                      admin: {
                        description:
                          'Prevent this locale from appearing in search results or the sitemap. Leave disabled for normal published posts.',
                      },
                      defaultValue: false,
                      localized: true,
                      label: 'No index',
                    },
                  ],
                },
              ],
            },
            {
              admin: {
                initCollapsed: true,
              },
              label: 'Managed Resources',
              type: 'collapsible',
              fields: [
                {
                  name: 'ownedMedia',
                  type: 'join',
                  collection: 'media',
                  on: 'ownerPost',
                  defaultLimit: 12,
                  defaultSort: '-updatedAt',
                  maxDepth: 0,
                  admin: {
                    allowCreate: false,
                    defaultColumns: ['filename', 'alt', 'updatedAt'],
                  },
                  label: 'Owned media',
                },
              ],
            },
          ],
        },
        {
          label: 'Overview',
          fields: [
            {
              name: 'postInsights',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/payload/PostInsights#PostInsights',
                },
              },
            },
          ],
        },
      ],
    },
    {
      admin: {
        position: 'sidebar',
      },
      name: 'slug',
      index: true,
      required: true,
      type: 'text',
      unique: true,
    },
    {
      admin: {
        position: 'sidebar',
      },
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'value',
          required: true,
          type: 'text',
        },
      ],
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
    afterDelete: [deleteOwnedResourcesAfterDelete],
    beforeDelete: [captureOwnedResourcesBeforeDelete],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const currentLocale = typeof req.locale === 'string' ? req.locale : defaultLocale
        const title = typeof data.title === 'string' ? data.title : originalDoc?.title

        if ((!data.slug || typeof data.slug !== 'string') && typeof title === 'string') {
          data.slug = slugify(title)
        }

        if (data._status === 'published' && !originalDoc?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }

        const content = typeof data.content === 'string' ? data.content : originalDoc?.content
        const bibliographyValue =
          data.bibliography && typeof data.bibliography === 'object'
            ? data.bibliography
            : originalDoc?.bibliography && typeof originalDoc.bibliography === 'object'
              ? originalDoc.bibliography
              : null

        if (!content || typeof content !== 'string') {
          return data
        }

        const citationKeys = extractCitationKeys(content)

        if (citationKeys.length === 0) {
          return data
        }

        if (!bibliographyValue) {
          throw new Error(
            `Locale "${currentLocale}" contains citation keys, but no bibliography source is stored on the post.`,
          )
        }

        const bibliographyEntries = await loadBibliographyEntries(bibliographyValue)
        const availableKeys = new Set(bibliographyEntries.map((entry) => entry.citationKey))
        const missingKeys = citationKeys.filter((key) => !availableKeys.has(key))

        if (missingKeys.length > 0) {
          throw new Error(
            `Missing bibliography entries for locale "${currentLocale}": ${missingKeys.join(', ')}.`,
          )
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
    maxPerDoc: 50,
  },
}
