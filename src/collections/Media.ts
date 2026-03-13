import type { CollectionConfig } from 'payload'

import { anyone, editorOnly } from '@/lib/access'
import { mediaUploadDir } from '@/lib/uploads'

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
      index: true,
      name: 'importKey',
      type: 'text',
      unique: true,
    },
  ],
  upload: {
    staticDir: mediaUploadDir,
  },
}
