import type { GlobalConfig } from 'payload'

import {
  getDefaultFrontendVariantLookup,
  normalizeFrontendVariantSettings,
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
        return {
          ...data,
          ...normalizeFrontendVariantSettings(data),
        }
      },
    ],
  },
  fields: [
    {
      name: 'values',
      type: 'json',
      defaultValue: getDefaultFrontendVariantLookup,
      label: 'Variant lookup',
      admin: {
        description:
          'Code-owned frontend surfaces and their active variants. Variants must already exist in the deployed code.',
        components: {
          Field:
            '/features/frontend-variants/admin/FrontendVariantLookupField#FrontendVariantLookupField',
        },
      },
      required: true,
    },
  ],
}
