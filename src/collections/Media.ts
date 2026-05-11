import type { CollectionConfig } from 'payload'

import { deletePersistedPDFPreviewAfterDelete } from '@/hooks/media/deletePersistedPDFPreviewAfterDelete'
import { syncPDFPreviewAfterChange } from '@/hooks/media/syncPDFPreviewAfterChange'
import { anyone, editorOnly } from '@/shared/auth/access'
import { mediaUploadDir } from '@/features/media/model/uploads'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: editorOnly,
    delete: editorOnly,
    read: anyone,
    update: editorOnly,
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'credit',
      type: 'text',
    },
    {
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      name: 'previewSVGStatus',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Ready',
          value: 'ready',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
      type: 'select',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'previewSVGURL',
      type: 'text',
    },
    {
      admin: {
        hidden: true,
        readOnly: true,
      },
      name: 'previewSVGFilename',
      type: 'text',
    },
    {
      admin: {
        condition: (_, siblingData) => siblingData.previewSVGStatus === 'failed',
        position: 'sidebar',
        readOnly: true,
      },
      name: 'previewSVGError',
      type: 'textarea',
    },
    {
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        readOnly: true,
      },
      name: 'previewSVGGeneratedAt',
      type: 'date',
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
  ],
  hooks: {
    afterChange: [syncPDFPreviewAfterChange],
    afterDelete: [deletePersistedPDFPreviewAfterDelete],
  },
  upload: {
    staticDir: mediaUploadDir,
  },
}
