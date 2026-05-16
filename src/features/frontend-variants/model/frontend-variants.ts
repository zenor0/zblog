import { parseDocument, stringify } from 'yaml'

export const articleTocVariantIDs = ['standard', 'progress-map'] as const
export type ArticleTocVariantID = (typeof articleTocVariantIDs)[number]

export const defaultArticleTocVariantID: ArticleTocVariantID = 'standard'

export type ArticleProgressMapConfig = {
  bendScale: number
  indentScale: number
  isTrackOffsetLocked: boolean
  lineWeight: 'fine' | 'regular' | 'strong'
  lockedTrackOffsetPx: number
  pathStyle: 'diagonal' | 'flow' | 'rounded' | 'stepped'
  railHeight: 'compact' | 'regular' | 'tall'
  scrollLeadScale: number
  spacingScale: number
  trackOverlapScale: number
  visibleHeadingLevels: (2 | 3 | 4)[]
}

export const defaultArticleProgressMapConfig: ArticleProgressMapConfig = {
  bendScale: 0.48,
  indentScale: 1,
  isTrackOffsetLocked: true,
  lineWeight: 'regular',
  lockedTrackOffsetPx: 22,
  pathStyle: 'rounded',
  railHeight: 'regular',
  scrollLeadScale: 0.46,
  spacingScale: 0.72,
  trackOverlapScale: 0.46,
  visibleHeadingLevels: [2, 3, 4],
}

export type FrontendVariantIDBySurface = {
  'article.toc': ArticleTocVariantID
}

export type FrontendVariantSurfaceID = keyof FrontendVariantIDBySurface

type FrontendVariantConfigBySurfaceAndVariant = {
  'article.toc': {
    'progress-map': ArticleProgressMapConfig
    standard: Record<string, never>
  }
}

export type FrontendVariantConfigFor<
  Surface extends FrontendVariantSurfaceID,
  Variant extends FrontendVariantIDBySurface[Surface],
> = FrontendVariantConfigBySurfaceAndVariant[Surface][Variant]

export type FrontendVariantConfigBySurface = {
  [Surface in FrontendVariantSurfaceID]: FrontendVariantConfigFor<
    Surface,
    FrontendVariantIDBySurface[Surface]
  >
}

export type FrontendVariantSelection<Surface extends FrontendVariantSurfaceID> = {
  config: FrontendVariantConfigBySurface[Surface]
  variant: FrontendVariantIDBySurface[Surface]
}

export type ResolvedFrontendVariants = {
  [Surface in FrontendVariantSurfaceID]: {
    configs: {
      [Variant in FrontendVariantIDBySurface[Surface]]: FrontendVariantConfigFor<Surface, Variant>
    }
    variant: FrontendVariantIDBySurface[Surface]
  }
}

type VariantConfigOption = {
  label: string
  value: number | string
}

type VariantConfigFieldBase = {
  description: string
  label: string
  name: string
}

export type FrontendVariantConfigField =
  | (VariantConfigFieldBase & {
      defaultValue: boolean
      type: 'boolean'
    })
  | (VariantConfigFieldBase & {
      defaultValue: number
      max: number
      min: number
      step: number
      type: 'number'
    })
  | (VariantConfigFieldBase & {
      defaultValue: number | string
      options: readonly VariantConfigOption[]
      type: 'select'
    })
  | (VariantConfigFieldBase & {
      defaultValue: readonly (number | string)[]
      minItems?: number
      options: readonly VariantConfigOption[]
      type: 'multiSelect'
    })

type FrontendVariantDefinition<Surface extends FrontendVariantSurfaceID> = {
  defaultVariant: FrontendVariantIDBySurface[Surface]
  description: string
  id: Surface
  label: string
  variants: readonly {
    configSchema?: readonly FrontendVariantConfigField[]
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

export type FrontendVariantLookupInput = Record<string, unknown>

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
        configSchema: [
          {
            defaultValue: defaultArticleProgressMapConfig.pathStyle,
            description: 'Shape used to draw the map path between headings.',
            label: 'Path style',
            name: 'pathStyle',
            options: [
              { label: 'Stepped', value: 'stepped' },
              { label: 'Rounded', value: 'rounded' },
              { label: 'Flow', value: 'flow' },
              { label: 'Diagonal', value: 'diagonal' },
            ],
            type: 'select',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.lineWeight,
            description: 'Stroke weight for the desktop map and mobile progress bar.',
            label: 'Line weight',
            name: 'lineWeight',
            options: [
              { label: 'Fine', value: 'fine' },
              { label: 'Regular', value: 'regular' },
              { label: 'Strong', value: 'strong' },
            ],
            type: 'select',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.railHeight,
            description: 'Maximum height of the desktop table-of-contents rail.',
            label: 'Rail height',
            name: 'railHeight',
            options: [
              { label: 'Compact', value: 'compact' },
              { label: 'Regular', value: 'regular' },
              { label: 'Tall', value: 'tall' },
            ],
            type: 'select',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.visibleHeadingLevels,
            description: 'Heading levels included in the progress map.',
            label: 'Visible heading levels',
            minItems: 1,
            name: 'visibleHeadingLevels',
            options: [
              { label: 'H2', value: 2 },
              { label: 'H3', value: 3 },
              { label: 'H4', value: 4 },
            ],
            type: 'multiSelect',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.bendScale,
            description: 'Amount of bend applied to rounded and flow paths.',
            label: 'Bend scale',
            max: 1,
            min: 0,
            name: 'bendScale',
            step: 0.01,
            type: 'number',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.indentScale,
            description: 'Horizontal spacing applied between heading levels.',
            label: 'Indent scale',
            max: 1.8,
            min: 0.55,
            name: 'indentScale',
            step: 0.01,
            type: 'number',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.isTrackOffsetLocked,
            description: 'Keeps the path a fixed distance from heading text.',
            label: 'Lock track offset',
            name: 'isTrackOffsetLocked',
            type: 'boolean',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.lockedTrackOffsetPx,
            description: 'Distance from heading text when the track offset is locked.',
            label: 'Locked track offset',
            max: 30,
            min: 10,
            name: 'lockedTrackOffsetPx',
            step: 1,
            type: 'number',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.spacingScale,
            description: 'Vertical rhythm between heading rows.',
            label: 'Spacing scale',
            max: 1.35,
            min: 0.35,
            name: 'spacingScale',
            step: 0.01,
            type: 'number',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.trackOverlapScale,
            description: 'How far unlocked paths may move into the heading text region.',
            label: 'Track overlap scale',
            max: 1,
            min: 0,
            name: 'trackOverlapScale',
            step: 0.01,
            type: 'number',
          },
          {
            defaultValue: defaultArticleProgressMapConfig.scrollLeadScale,
            description: 'Lead distance used when keeping the active heading in view.',
            label: 'Scroll lead scale',
            max: 0.8,
            min: 0.12,
            name: 'scrollLeadScale',
            step: 0.01,
            type: 'number',
          },
        ],
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

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as T
  }

  return value
}

function getVariantDefinition<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  variant: FrontendVariantIDBySurface[Surface],
) {
  return frontendVariantRegistry[surface].variants.find((item) => item.id === variant)
}

export function getSurfaceDefaultVariant<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
): FrontendVariantIDBySurface[Surface] {
  return frontendVariantRegistry[surface].defaultVariant as FrontendVariantIDBySurface[Surface]
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

function getConfigSchema<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  variant: FrontendVariantIDBySurface[Surface],
) {
  const definition = getVariantDefinition(surface, variant)

  return definition && 'configSchema' in definition
    ? (definition.configSchema as readonly FrontendVariantConfigField[])
    : []
}

function formatConfigPath(name: string) {
  return name
}

function normalizeFieldValue(
  field: FrontendVariantConfigField,
  value: unknown,
  options: { strict: boolean },
) {
  if (value === undefined) {
    return cloneValue(field.defaultValue)
  }

  if (field.type === 'boolean') {
    if (typeof value === 'boolean') {
      return value
    }

    if (options.strict) {
      throw new Error(`${formatConfigPath(field.name)} must be a boolean.`)
    }

    return cloneValue(field.defaultValue)
  }

  if (field.type === 'number') {
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (value >= field.min && value <= field.max) {
        return value
      }

      if (options.strict) {
        throw new Error(
          `${formatConfigPath(field.name)} must be between ${field.min} and ${field.max}.`,
        )
      }
    } else if (options.strict) {
      throw new Error(`${formatConfigPath(field.name)} must be a number.`)
    }

    return cloneValue(field.defaultValue)
  }

  if (field.type === 'select') {
    if (field.options.some((option) => option.value === value)) {
      return value
    }

    if (options.strict) {
      throw new Error(`${formatConfigPath(field.name)} must be one of the registered options.`)
    }

    return cloneValue(field.defaultValue)
  }

  if (field.type === 'multiSelect') {
    if (!Array.isArray(value)) {
      if (options.strict) {
        throw new Error(`${formatConfigPath(field.name)} must be an array.`)
      }

      return cloneValue(field.defaultValue)
    }

    const allowedValues = new Set(field.options.map((option) => option.value))
    const normalized = value.filter((item, index) => {
      return allowedValues.has(item as string | number) && value.indexOf(item) === index
    })

    if (normalized.length !== value.length && options.strict) {
      throw new Error(`${formatConfigPath(field.name)} contains an unregistered option.`)
    }

    if (field.minItems && normalized.length < field.minItems) {
      if (options.strict) {
        throw new Error(
          `${formatConfigPath(field.name)} must include at least ${field.minItems} option.`,
        )
      }

      return cloneValue(field.defaultValue)
    }

    return normalized.length > 0 ? normalized : cloneValue(field.defaultValue)
  }
}

function normalizeVariantConfig<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  variant: FrontendVariantIDBySurface[Surface],
  config: unknown,
  options: { strict: boolean },
): FrontendVariantConfigBySurfaceAndVariant[Surface][typeof variant] {
  const schema = getConfigSchema(surface, variant)

  if (schema.length === 0) {
    if (options.strict && isRecord(config) && Object.keys(config).length > 0) {
      throw new Error(`${String(variant)} does not accept config.`)
    }

    return {} as FrontendVariantConfigBySurfaceAndVariant[Surface][typeof variant]
  }

  if (config !== undefined && config !== null && !isRecord(config)) {
    if (options.strict) {
      throw new Error(`${String(variant)} config must be an object.`)
    }
  }

  const configRecord = isRecord(config) ? config : {}
  const allowedKeys = new Set(schema.map((field: FrontendVariantConfigField) => field.name))

  if (options.strict) {
    const unknownKeys = Object.keys(configRecord).filter((key) => !allowedKeys.has(key))

    if (unknownKeys.length > 0) {
      throw new Error(
        `${unknownKeys.join(', ')} ${
          unknownKeys.length === 1 ? 'is' : 'are'
        } not allowed in ${String(variant)} config.`,
      )
    }
  }

  return Object.fromEntries(
    schema.map((field: FrontendVariantConfigField) => [
      field.name,
      normalizeFieldValue(field, configRecord[field.name], options),
    ]),
  ) as FrontendVariantConfigBySurfaceAndVariant[Surface][typeof variant]
}

function normalizeVariantConfigs<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  configs: unknown,
  options: { strict: boolean },
): ResolvedFrontendVariants[Surface]['configs'] {
  if (configs !== undefined && configs !== null && !isRecord(configs)) {
    if (options.strict) {
      throw new Error(`${surface} configs must be an object.`)
    }
  }

  const configRecord = isRecord(configs) ? configs : {}
  const variantIDs = frontendVariantRegistry[surface].variants.map((variant) => variant.id)

  if (options.strict) {
    const unknownVariants = Object.keys(configRecord).filter(
      (variant) => !isFrontendVariantIDForSurface(surface, variant),
    )

    if (unknownVariants.length > 0) {
      throw new Error(`Unknown config variant for ${surface}: ${unknownVariants.join(', ')}.`)
    }
  }

  return Object.fromEntries(
    variantIDs.map((variant) => [
      variant,
      normalizeVariantConfig(surface, variant, configRecord[variant], options),
    ]),
  ) as ResolvedFrontendVariants[Surface]['configs']
}

export function getDefaultFrontendVariantLookup(): ResolvedFrontendVariants {
  const lookup = {} as ResolvedFrontendVariants

  frontendVariantSurfaceIDs.forEach((surface) => {
    lookup[surface] = {
      configs: normalizeVariantConfigs(surface, {}, { strict: false }) as never,
      variant: getSurfaceDefaultVariant(surface) as never,
    }
  })

  return lookup
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

function buildSelection<Surface extends FrontendVariantSurfaceID>(args: {
  configs?: unknown
  strict: boolean
  surface: Surface
  variant: FrontendVariantIDBySurface[Surface]
}): ResolvedFrontendVariants[Surface] {
  return {
    configs: normalizeVariantConfigs(args.surface, args.configs, { strict: args.strict }),
    variant: args.variant,
  } as ResolvedFrontendVariants[Surface]
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

    resolved[selection.surface] = buildSelection({
      strict: false,
      surface: selection.surface,
      variant: selection.variant,
    }) as never
  })

  return resolved
}

function hasLookupValues(settings: FrontendVariantSettingsInput) {
  return isRecord(settings) && settings.values !== undefined && settings.values !== null
}

function resolveFrontendVariantLookupRecord(
  values: Record<string, unknown>,
  options: { strict: boolean },
): Partial<ResolvedFrontendVariants> {
  const resolved: Partial<ResolvedFrontendVariants> = {}

  Object.entries(values).forEach(([surface, value]) => {
    if (!isFrontendVariantSurfaceID(surface)) {
      if (options.strict) {
        throw new Error(`Unknown frontend variant surface: ${surface}.`)
      }

      return
    }

    if (isFrontendVariantIDForSurface(surface, value)) {
      resolved[surface] = buildSelection({
        strict: options.strict,
        surface,
        variant: value,
      }) as never
      return
    }

    if (!isRecord(value)) {
      if (options.strict) {
        throw new Error(`Unknown frontend variant "${value ?? 'empty'}" for ${surface}.`)
      }

      return
    }

    const variant = value.variant

    if (!isFrontendVariantIDForSurface(surface, variant)) {
      if (options.strict) {
        throw new Error(`Unknown frontend variant "${variant ?? 'empty'}" for ${surface}.`)
      }

      return
    }

    resolved[surface] = buildSelection({
      configs: value.configs,
      strict: options.strict,
      surface,
      variant,
    }) as never
  })

  return resolved
}

export function resolveFrontendVariantValues(
  settings: FrontendVariantSettingsInput,
): Partial<ResolvedFrontendVariants> {
  if (hasLookupValues(settings)) {
    return isRecord(settings?.values)
      ? resolveFrontendVariantLookupRecord(settings.values, { strict: false })
      : {}
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
      lookup[surface] = {
        ...lookup[surface],
        variant: override,
      } as never
    }
  })

  return lookup
}

export function resolveFrontendVariantSelection<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  settings: FrontendVariantSettingsInput,
  overrides?: FrontendVariantOverrideInput,
): FrontendVariantSelection<Surface> {
  const selection = resolveFrontendVariantLookup(settings, overrides)[surface]

  return {
    config: selection.configs[selection.variant] as FrontendVariantConfigBySurface[Surface],
    variant: selection.variant,
  }
}

export function resolveFrontendVariant<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  settings: FrontendVariantSettingsInput,
  overrides?: FrontendVariantOverrideInput,
): FrontendVariantIDBySurface[Surface] {
  return resolveFrontendVariantSelection(surface, settings, overrides).variant
}

export function resolveFrontendVariantConfig<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  settings: FrontendVariantSettingsInput,
  overrides?: FrontendVariantOverrideInput,
): FrontendVariantConfigBySurface[Surface] {
  return resolveFrontendVariantSelection(surface, settings, overrides).config
}

export function validateFrontendVariantSettings(settings: FrontendVariantSettingsInput) {
  if (hasLookupValues(settings)) {
    if (settings?.values !== undefined && settings.values !== null && !isRecord(settings.values)) {
      throw new Error('Frontend variant lookup must be an object.')
    }

    if (isRecord(settings?.values)) {
      resolveFrontendVariantLookupRecord(settings.values, { strict: true })
    }

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

export function serializeFrontendVariantConfigToYAML<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  variant: FrontendVariantIDBySurface[Surface],
  config: unknown,
) {
  const normalized = normalizeVariantConfig(surface, variant, config, { strict: false })

  return stringify(normalized, {
    indent: 2,
    lineWidth: 0,
  })
}

export function parseFrontendVariantConfigYAML<Surface extends FrontendVariantSurfaceID>(
  surface: Surface,
  variant: FrontendVariantIDBySurface[Surface],
  yamlSource: string,
): FrontendVariantConfigBySurfaceAndVariant[Surface][typeof variant] {
  const document = parseDocument(yamlSource)

  if (document.errors.length > 0) {
    throw new Error(`Invalid YAML: ${document.errors[0]?.message ?? 'Could not parse config.'}`)
  }

  const value = document.toJS() ?? {}

  if (!isRecord(value)) {
    throw new Error(`${String(variant)} config YAML must be an object.`)
  }

  return normalizeVariantConfig(surface, variant, value, { strict: true })
}
