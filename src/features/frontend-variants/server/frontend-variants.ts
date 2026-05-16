import { cache } from 'react'

import {
  resolveFrontendVariant,
  type FrontendVariantIDBySurface,
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

export async function getFrontendVariant<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  overrides?: FrontendVariantOverrideInput,
): Promise<FrontendVariantIDBySurface[Surface]> {
  const settings = await getCachedFrontendVariantSettings()

  return resolveFrontendVariant(surface, settings, overrides)
}
