import type { CollectionConfig } from 'payload'

import { editorOnly } from '@/shared/auth/access'
import { supportedLocales } from '@/shared/i18n/locales'

const localeOptions = supportedLocales.map(({ code, label }) => ({
  label,
  value: code,
}))

export const PostViewDedupe: CollectionConfig = {
  slug: 'post-view-dedupe',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: editorOnly,
    update: editorOnly,
  },
  admin: {
    defaultColumns: ['post', 'locale', 'expiresAt', 'lastSeenAt'],
    group: 'Operations',
    hidden: true,
    useAsTitle: 'dedupeKey',
  },
  fields: [
    {
      index: true,
      name: 'dedupeKey',
      required: true,
      type: 'text',
      unique: true,
    },
    {
      index: true,
      maxDepth: 0,
      name: 'post',
      relationTo: 'posts',
      required: true,
      type: 'relationship',
    },
    {
      index: true,
      name: 'locale',
      options: localeOptions,
      required: true,
      type: 'select',
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      name: 'firstSeenAt',
      required: true,
      type: 'date',
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      name: 'lastSeenAt',
      required: true,
      type: 'date',
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      index: true,
      name: 'expiresAt',
      required: true,
      type: 'date',
    },
  ],
  timestamps: true,
}
