export const articleTocVariantIDs = ['standard', 'progress-map'] as const
export type ArticleTocVariantID = (typeof articleTocVariantIDs)[number]

export const defaultArticleTocVariantID: ArticleTocVariantID = 'standard'

export type FrontendVariantIDBySurface = {
  'article.toc': ArticleTocVariantID
}

export type FrontendVariantSurfaceID = keyof FrontendVariantIDBySurface

type FrontendVariantDefinition<Surface extends FrontendVariantSurfaceID> = {
  defaultVariant: FrontendVariantIDBySurface[Surface]
  description: string
  id: Surface
  label: string
  variants: readonly {
    description: string
    id: FrontendVariantIDBySurface[Surface]
    label: string
  }[]
}

type FrontendVariantRegistry = {
  [Surface in FrontendVariantSurfaceID]: FrontendVariantDefinition<Surface>
}

export type FrontendVariantSelectionInput = {
  surface?: null | string
  variant?: null | string
}

export type FrontendVariantLookupInput = Record<string, null | string | undefined>

export type FrontendVariantSettingsInput =
  | {
      selections?: FrontendVariantSelectionInput[] | null
      values?: null | FrontendVariantLookupInput | unknown
    }
  | null
  | undefined

export type FrontendVariantOverrideInput =
  | URLSearchParams
  | null
  | Record<string, string | string[] | undefined>
  | undefined

export type ResolvedFrontendVariants = {
  [Surface in FrontendVariantSurfaceID]: FrontendVariantIDBySurface[Surface]
}

export const frontendVariantRegistry = {
  'article.toc': {
    defaultVariant: defaultArticleTocVariantID,
    description: 'Controls the article page table-of-contents implementation.',
    id: 'article.toc',
    label: 'Article table of contents',
    variants: [
      {
        description: 'The existing compact anchor list with simple reading progress.',
        id: 'standard',
        label: 'Standard',
      },
      {
        description: 'A structured progress map with an active reading range.',
        id: 'progress-map',
        label: 'Progress map',
      },
    ],
  },
} as const satisfies FrontendVariantRegistry

export const frontendVariantSurfaceIDs = Object.keys(
  frontendVariantRegistry,
) as FrontendVariantSurfaceID[]

function hasOwn(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export function isFrontendVariantSurfaceID(value: unknown): value is FrontendVariantSurfaceID {
  return typeof value === 'string' && hasOwn(frontendVariantRegistry, value)
}

export function isArticleTocVariantID(value: unknown): value is ArticleTocVariantID {
  return articleTocVariantIDs.includes(value as ArticleTocVariantID)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getSurfaceDefaultVariant<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
): FrontendVariantIDBySurface[Surface] {
  return frontendVariantRegistry[surface].defaultVariant as FrontendVariantIDBySurface[Surface]
}

export function getDefaultFrontendVariantLookup(): ResolvedFrontendVariants {
  const lookup = {} as ResolvedFrontendVariants

  frontendVariantSurfaceIDs.forEach((surface) => {
    lookup[surface] = getSurfaceDefaultVariant(surface) as never
  })

  return lookup
}

export function isFrontendVariantIDForSurface<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  value: unknown,
): value is FrontendVariantIDBySurface[Surface] {
  return (
    typeof value === 'string' &&
    frontendVariantRegistry[surface].variants.some((variant) => variant.id === value)
  )
}

function getOverrideValue(
  surface: FrontendVariantSurfaceID,
  overrides: FrontendVariantOverrideInput,
) {
  if (!overrides) {
    return null
  }

  const key = `variant.${surface}`

  if (overrides instanceof URLSearchParams) {
    return overrides.get(key)
  }

  const value = overrides[key]

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export function getFrontendVariantOverride<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  overrides: FrontendVariantOverrideInput,
): FrontendVariantIDBySurface[Surface] | null {
  const value = getOverrideValue(surface, overrides)

  return isFrontendVariantIDForSurface(surface, value) ? value : null
}

function resolveLegacyFrontendVariantSelections(
  settings: FrontendVariantSettingsInput,
): Partial<ResolvedFrontendVariants> {
  const selections = Array.isArray(settings?.selections) ? settings.selections : []
  const resolved: Partial<ResolvedFrontendVariants> = {}

  selections.forEach((selection) => {
    if (!isFrontendVariantSurfaceID(selection?.surface)) {
      return
    }

    if (!isFrontendVariantIDForSurface(selection.surface, selection.variant)) {
      return
    }

    resolved[selection.surface] = selection.variant as never
  })

  return resolved
}

function hasLookupValues(settings: FrontendVariantSettingsInput) {
  return isRecord(settings) && settings.values !== undefined && settings.values !== null
}

function resolveFrontendVariantLookupRecord(
  values: Record<string, unknown>,
): Partial<ResolvedFrontendVariants> {
  const resolved: Partial<ResolvedFrontendVariants> = {}

  Object.entries(values).forEach(([surface, value]) => {
    if (!isFrontendVariantSurfaceID(surface)) {
      return
    }

    if (!isFrontendVariantIDForSurface(surface, value)) {
      return
    }

    resolved[surface] = value as never
  })

  return resolved
}

export function resolveFrontendVariantValues(
  settings: FrontendVariantSettingsInput,
): Partial<ResolvedFrontendVariants> {
  if (hasLookupValues(settings)) {
    return isRecord(settings?.values) ? resolveFrontendVariantLookupRecord(settings.values) : {}
  }

  return resolveLegacyFrontendVariantSelections(settings)
}

export function resolveFrontendVariantLookup(
  settings: FrontendVariantSettingsInput,
  overrides?: FrontendVariantOverrideInput,
): ResolvedFrontendVariants {
  const lookup = getDefaultFrontendVariantLookup()
  const configured = resolveFrontendVariantValues(settings)

  frontendVariantSurfaceIDs.forEach((surface) => {
    const configuredValue = configured[surface]

    if (configuredValue) {
      lookup[surface] = configuredValue as never
    }

    const override = getFrontendVariantOverride(surface, overrides)

    if (override) {
      lookup[surface] = override as never
    }
  })

  return lookup
}

export function resolveFrontendVariant<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  settings: FrontendVariantSettingsInput,
  overrides?: FrontendVariantOverrideInput,
): FrontendVariantIDBySurface[Surface] {
  return resolveFrontendVariantLookup(settings, overrides)[surface]
}

function validateFrontendVariantLookup(values: unknown) {
  if (values === undefined || values === null) {
    return
  }

  if (!isRecord(values)) {
    throw new Error('Frontend variant lookup must be an object.')
  }

  Object.entries(values).forEach(([surface, variant]) => {
    if (!isFrontendVariantSurfaceID(surface)) {
      throw new Error(`Unknown frontend variant surface: ${surface}.`)
    }

    if (!isFrontendVariantIDForSurface(surface, variant)) {
      throw new Error(`Unknown frontend variant "${variant ?? 'empty'}" for ${surface}.`)
    }
  })
}

export function validateFrontendVariantSettings(settings: FrontendVariantSettingsInput) {
  if (hasLookupValues(settings)) {
    validateFrontendVariantLookup(settings?.values)

    return
  }

  const selections = Array.isArray(settings?.selections) ? settings.selections : []
  const seen = new Set<FrontendVariantSurfaceID>()

  selections.forEach((selection) => {
    if (!isFrontendVariantSurfaceID(selection?.surface)) {
      throw new Error(`Unknown frontend variant surface: ${selection?.surface ?? 'empty'}.`)
    }

    if (seen.has(selection.surface)) {
      throw new Error(`Duplicate frontend variant surface: ${selection.surface}.`)
    }

    seen.add(selection.surface)

    if (!isFrontendVariantIDForSurface(selection.surface, selection.variant)) {
      throw new Error(
        `Unknown frontend variant "${selection.variant ?? 'empty'}" for ${selection.surface}.`,
      )
    }
  })
}

export function normalizeFrontendVariantSettings(settings: FrontendVariantSettingsInput) {
  validateFrontendVariantSettings(settings)

  return {
    values: resolveFrontendVariantLookup(settings),
  }
}
