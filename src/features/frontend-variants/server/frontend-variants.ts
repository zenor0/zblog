import { cache } from 'react'

import {
  resolveFrontendVariant,
  type FrontendVariantOverrideInput,
  type FrontendVariantSettingsInput,
  type FrontendVariantSurfaceID,
} from '@/features/frontend-variants/model/frontend-variants'
import { getPayloadClient } from '@/shared/payload/client'

const getCachedFrontendVariantSettings = cache(async (): Promise<FrontendVariantSettingsInput> => {
  const payload = await getPayloadClient()

  return payload.findGlobal({
    slug: 'frontend-variants',
    depth: 0,
    overrideAccess: false,
  })
})

export async function getFrontendVariant(
  surface: FrontendVariantSurfaceID,
  overrides?: FrontendVariantOverrideInput,
) {
  const settings = await getCachedFrontendVariantSettings()

  return resolveFrontendVariant(surface, settings, overrides)
}
