import type { CollectionConfig, Where } from 'payload'

import { autoTranslatePostEndpoint } from '@/endpoints/posts/autoTranslatePost'
import { captureOwnedResourcesBeforeDelete } from '@/hooks/posts/captureOwnedResourcesBeforeDelete'
import { deleteOwnedResourcesAfterDelete } from '@/hooks/posts/deleteOwnedResourcesAfterDelete'
import { editorOnly, publishedOrEditor, publishedVersionsOrEditor } from '@/lib/access'
import { loadBibliographyEntries } from '@/lib/bibliography'
import { extractCitationKeys } from '@/lib/citations'
import { defaultLocale } from '@/lib/locales'
import { buildPostPreviewURL } from '@/lib/preview'
import { slugify } from '@/lib/slugs'

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
    },
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    preview: (doc, { locale }) => {
      const id = doc?.id

      if (!(typeof id === 'number' || typeof id === 'string')) {
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
                  'Markdown is supported here, including blockquotes, fenced code, tables, callouts via :::note, and citations via [@citation-key].',
                language: 'markdown',
              },
              localized: true,
              name: 'content',
              required: true,
              type: 'code',
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              admin: {
                description:
                  'Link a BibTeX source here. Citation keys used in the current locale content are validated against the stored bibliography text.',
              },
              filterOptions: sharedOrCurrentPostOwnedFilter,
              name: 'bibliographyFile',
              relationTo: 'bibliography-files',
              type: 'relationship',
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
          label: 'References',
        },
        {
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
          label: 'Translations',
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
      filterOptions: sharedOrCurrentPostOwnedFilter,
      name: 'heroImage',
      relationTo: 'media',
      type: 'relationship',
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
        const bibliographyValue = data.bibliographyFile ?? originalDoc?.bibliographyFile

        if (!content || typeof content !== 'string') {
          return data
        }

        const citationKeys = extractCitationKeys(content)

        if (citationKeys.length === 0) {
          return data
        }

        if (!bibliographyValue) {
          throw new Error(
            `Locale "${currentLocale}" contains citation keys, but no bibliography file is linked to the post.`,
          )
        }

        const bibliographyFile =
          typeof bibliographyValue === 'number'
            ? await req.payload.findByID({
                collection: 'bibliography-files',
                id: bibliographyValue,
                overrideAccess: false,
                req,
              })
            : bibliographyValue

        const bibliographyEntries = await loadBibliographyEntries(bibliographyFile)
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
