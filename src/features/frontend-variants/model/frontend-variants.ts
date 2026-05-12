export const articleTocVariantIDs = ['standard', 'progress-map'] as const
export type ArticleTocVariantID = (typeof articleTocVariantIDs)[number]

export const defaultArticleTocVariantID: ArticleTocVariantID = 'standard'

export type FrontendVariantSurfaceID = 'article.toc'

type FrontendVariantDefinition<VariantID extends string> = {
  defaultVariant: VariantID
  description: string
  id: FrontendVariantSurfaceID
  label: string
  variants: {
    description: string
    id: VariantID
    label: string
  }[]
}

export type FrontendVariantSelectionInput = {
  surface?: null | string
  variant?: null | string
}

export type FrontendVariantSettingsInput =
  | {
      selections?: FrontendVariantSelectionInput[] | null
    }
  | null
  | undefined

export type FrontendVariantOverrideInput =
  | URLSearchParams
  | null
  | Record<string, string | string[] | undefined>
  | undefined

export type ResolvedFrontendVariants = {
  'article.toc': ArticleTocVariantID
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
} as const satisfies Record<
  FrontendVariantSurfaceID,
  FrontendVariantDefinition<ArticleTocVariantID>
>

export const frontendVariantSurfaceOptions = Object.values(frontendVariantRegistry).map(
  (surface) => ({
    label: `${surface.label} - ${surface.description}`,
    value: surface.id,
  }),
)

export const frontendVariantVariantOptions = frontendVariantRegistry['article.toc'].variants.map(
  (variant) => ({
    label: `${variant.label} - ${variant.description}`,
    value: variant.id,
  }),
)

function hasOwn(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function isFrontendVariantSurfaceID(value: unknown): value is FrontendVariantSurfaceID {
  return typeof value === 'string' && hasOwn(frontendVariantRegistry, value)
}

export function isArticleTocVariantID(value: unknown): value is ArticleTocVariantID {
  return articleTocVariantIDs.includes(value as ArticleTocVariantID)
}

function getSurfaceDefaultVariant(surface: FrontendVariantSurfaceID) {
  return frontendVariantRegistry[surface].defaultVariant
}

function isKnownVariantForSurface(
  surface: FrontendVariantSurfaceID,
  value: unknown,
): value is ArticleTocVariantID {
  if (surface === 'article.toc') {
    return isArticleTocVariantID(value)
  }

  return false
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

export function getFrontendVariantOverride(
  surface: FrontendVariantSurfaceID,
  overrides: FrontendVariantOverrideInput,
): ArticleTocVariantID | null {
  const value = getOverrideValue(surface, overrides)

  return isKnownVariantForSurface(surface, value) ? value : null
}

export function resolveFrontendVariantSelections(
  settings: FrontendVariantSettingsInput,
): Partial<ResolvedFrontendVariants> {
  const selections = Array.isArray(settings?.selections) ? settings.selections : []
  const resolved: Partial<ResolvedFrontendVariants> = {}

  selections.forEach((selection) => {
    if (!isFrontendVariantSurfaceID(selection?.surface)) {
      return
    }

    if (!isKnownVariantForSurface(selection.surface, selection.variant)) {
      return
    }

    resolved[selection.surface] = selection.variant
  })

  return resolved
}

export function resolveFrontendVariant(
  surface: FrontendVariantSurfaceID,
  settings: FrontendVariantSettingsInput,
  overrides?: FrontendVariantOverrideInput,
): ArticleTocVariantID {
  const override = getFrontendVariantOverride(surface, overrides)

  if (override) {
    return override
  }

  const selections = resolveFrontendVariantSelections(settings)

  return selections[surface] ?? getSurfaceDefaultVariant(surface)
}

export function validateFrontendVariantSettings(settings: FrontendVariantSettingsInput) {
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

    if (!isKnownVariantForSurface(selection.surface, selection.variant)) {
      throw new Error(
        `Unknown frontend variant "${selection.variant ?? 'empty'}" for ${selection.surface}.`,
      )
    }
  })
}
