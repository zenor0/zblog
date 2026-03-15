import type { CollectionConfig } from 'payload'

import { anyone, editorOnly } from '@/lib/access'

export const BibliographyFiles: CollectionConfig = {
  slug: 'bibliography-files',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: anyone,
    update: editorOnly,
  },
  admin: {
    defaultColumns: ['title', 'sourceFilename', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      admin: {
        description:
          'Compatibility field for the original BibTeX filename. New imports keep this unique, but the actual bibliography is stored as text below.',
      },
      index: true,
      name: 'filename',
      type: 'text',
      unique: true,
    },
    {
      admin: {
        description:
          'Paste or import BibTeX source here. Citation validation reads directly from this text field.',
        language: 'plaintext',
      },
      name: 'source',
      type: 'code',
    },
    {
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      name: 'importKey',
      type: 'text',
      unique: true,
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      index: true,
      maxDepth: 0,
      name: 'ownerPost',
      relationTo: 'posts',
      type: 'relationship',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'url',
      type: 'text',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'thumbnailURL',
      type: 'text',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'mimeType',
      type: 'text',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'filesize',
      type: 'number',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'width',
      type: 'number',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'height',
      type: 'number',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'focalX',
      type: 'number',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'focalY',
      type: 'number',
    },
  ],
}
