import type { GlobalConfig } from 'payload'

import {
  frontendVariantSurfaceOptions,
  frontendVariantVariantOptions,
  validateFrontendVariantSettings,
} from '@/features/frontend-variants/model/frontend-variants'
import { anyone, editorOnly } from '@/shared/auth/access'

export const FrontendVariants: GlobalConfig = {
  slug: 'frontend-variants',
  label: 'Frontend variants',
  access: {
    read: anyone,
    update: editorOnly,
  },
  admin: {
    description: 'Select code-owned frontend component variants without changing site content.',
    group: 'Frontend',
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        validateFrontendVariantSettings(data)

        return data
      },
    ],
  },
  fields: [
    {
      name: 'selections',
      type: 'array',
      admin: {
        description:
          'Each surface can appear once. Variants must already exist in the deployed code.',
      },
      fields: [
        {
          name: 'surface',
          type: 'select',
          label: 'Surface',
          options: frontendVariantSurfaceOptions,
          required: true,
        },
        {
          name: 'variant',
          type: 'select',
          label: 'Variant',
          options: frontendVariantVariantOptions,
          required: true,
        },
      ],
      label: 'Selections',
      labels: {
        plural: 'Selections',
        singular: 'Selection',
      },
    },
  ],
}
