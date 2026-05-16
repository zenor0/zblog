# Frontend Variants

## Purpose

Frontend variants let editors choose between code-owned component implementations without changing article or site content. The system is a lookup table: each registered frontend surface has one active variant, and rendering code resolves that surface to a concrete component at request time.

Use variants for production-ready alternatives such as navigation treatments, article support UI, or other bounded frontend slots. Do not use this system for content, arbitrary React execution, or one-off layout experiments that still belong under `/dev`.

## Data Flow

The registry in `src/features/frontend-variants/model/frontend-variants.ts` is the source of truth for surfaces, variant IDs, labels, descriptions, defaults, and optional variant config schemas.

Payload stores the active configuration in the `frontend-variants` global as:

```ts
{
  values: {
    'article.toc': {
      variant: 'progress-map',
      configs: {
        standard: {},
        'progress-map': {
          pathStyle: 'rounded',
          lineWeight: 'regular',
          railHeight: 'regular',
          visibleHeadingLevels: [2, 3, 4],
          bendScale: 0.48,
          indentScale: 1,
          isTrackOffsetLocked: true,
          lockedTrackOffsetPx: 22,
          spacingScale: 0.72,
          trackOverlapScale: 0.46,
          scrollLeadScale: 0.46,
        },
      },
    },
  },
}
```

The admin field renders every registered surface as a fixed row in a table. Editors choose a variant from that row; they do not add ad hoc selection rows. If the active variant exposes a schema, the row can expand into generated controls and a Raw YAML editor for that variant's config. Saving normalizes the lookup so every known surface has an active variant and default config for every registered variant.

Frontend routes call `getFrontendVariantSelection(surface, searchParams)` to resolve the active variant and config together. Query parameters in the form `variant.<surface>=<variant>` can override a valid variant for preview and development, for example:

```text
/en/posts/example?variant.article.toc=progress-map
```

Invalid stored values and invalid overrides fall back to the surface default. Old string lookups such as `{ 'article.toc': 'progress-map' }` are still readable and are normalized into the structured shape on save.

## Creating A Variant Surface

Add the surface and variants to `frontendVariantRegistry`.

```ts
export type FrontendVariantIDBySurface = {
  'article.toc': ArticleTocVariantID
  'example.banner': 'compact' | 'feature'
}

export const frontendVariantRegistry = {
  'example.banner': {
    defaultVariant: 'compact',
    description: 'Controls the example banner implementation.',
    id: 'example.banner',
    label: 'Example banner',
    variants: [
      {
        description: 'A compact inline banner.',
        id: 'compact',
        label: 'Compact',
      },
      {
        configSchema: [
          {
            defaultValue: 'soft',
            description: 'Visual density of the feature treatment.',
            label: 'Density',
            name: 'density',
            options: [
              { label: 'Soft', value: 'soft' },
              { label: 'Dense', value: 'dense' },
            ],
            type: 'select',
          },
        ],
        description: 'A larger banner with supporting metadata.',
        id: 'feature',
        label: 'Feature',
      },
    ],
  },
}
```

Config schema fields support `select`, `multiSelect`, `number`, and `boolean`. Keep surface IDs, variant IDs, and config field names stable once content editors can save them. Renaming any of those is a data migration.

## Rendering A Configurable Slot

Resolve the selected variant in the route or server component that owns the page composition:

```tsx
const bannerSelection = await getFrontendVariantSelection('example.banner', searchParams)
```

Create a renderer map and pass the active variant plus config to `FrontendVariantSlot`.

```tsx
const bannerRenderers = {
  compact: CompactBanner,
  feature: FeatureBanner,
} satisfies FrontendVariantRendererMap<'example.banner', BannerProps>

export function ExampleBannerSlot(
  props: BannerProps & {
    config: ExampleBannerConfig
    variant: ExampleBannerVariantID
  },
) {
  const { config, variant, ...slotProps } = props

  return (
    <FrontendVariantSlot
      config={config}
      renderers={bannerRenderers}
      slotProps={slotProps}
      surface="example.banner"
      variant={variant}
    />
  )
}
```

Renderer components should share the same slot props for a surface. Variant-specific tuning should come from the registry schema; content should still come from post/site data or a dedicated content schema.

## Current Configured Variant

`article.toc / progress-map` exposes stable production controls from the article progress lab:

- `pathStyle`
- `lineWeight`
- `railHeight`
- `visibleHeadingLevels`
- `bendScale`
- `indentScale`
- `isTrackOffsetLocked`
- `lockedTrackOffsetPx`
- `spacingScale`
- `trackOverlapScale`
- `scrollLeadScale`

Color, debug boundaries, and mobile prototype switching are intentionally not part of the production config.

## Verification

When adding or changing a frontend variant surface:

- Add model tests for registry defaults, lookup/config resolution, invalid values, invalid config, Raw YAML parsing, and query overrides.
- Add rendering tests for the slot or component dispatcher.
- Add admin tests when a variant adds schema-driven controls.
- Run `pnpm run generate:types` after schema changes.
- Run `pnpm run generate:importmap` after adding or moving admin components.
- Run `pnpm exec tsc --noEmit` and the relevant integration tests.
