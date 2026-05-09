import type { CollectionConfig } from 'payload'

import { editorOnly } from '@/lib/access'
import { supportedLocales } from '@/lib/locales'

const localeOptions = supportedLocales.map(({ code, label }) => ({
  label,
  value: code,
}))

export const PostViewMetrics: CollectionConfig = {
  slug: 'post-view-metrics',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: editorOnly,
    update: editorOnly,
  },
  admin: {
    defaultColumns: ['post', 'locale', 'viewCount', 'uniqueVisitors', 'rawHits', 'lastViewedAt'],
    group: 'Operations',
    useAsTitle: 'metricKey',
  },
  fields: [
    {
      index: true,
      name: 'metricKey',
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
      defaultValue: 0,
      min: 0,
      name: 'viewCount',
      required: true,
      type: 'number',
    },
    {
      defaultValue: 0,
      min: 0,
      name: 'rawHits',
      required: true,
      type: 'number',
    },
    {
      defaultValue: 0,
      min: 0,
      name: 'uniqueVisitors',
      required: true,
      type: 'number',
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      index: true,
      name: 'lastViewedAt',
      type: 'date',
    },
  ],
  timestamps: true,
}
