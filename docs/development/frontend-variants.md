# Frontend Variants

## Purpose

Frontend variants let editors choose between code-owned component implementations without changing article or site content. The system is a lookup table: each registered frontend surface has one active variant, and rendering code resolves that surface to a concrete component at request time.

Use variants for production-ready alternatives such as navigation treatments, article support UI, or other bounded frontend slots. Do not use this system for content, arbitrary React execution, or one-off layout experiments that still belong under `/dev`.

## Data Flow

The registry in `src/features/frontend-variants/model/frontend-variants.ts` is the source of truth for surfaces, variant IDs, labels, descriptions, and defaults.

Payload stores the active configuration in the `frontend-variants` global as:

```ts
{
  values: {
    'article.toc': 'progress-map',
  },
}
```

The admin field renders every registered surface as a fixed row in a table. Editors choose a variant from that row; they do not add ad hoc selection rows. Saving normalizes the lookup so every known surface has a value.

Frontend routes call `getFrontendVariant(surface, searchParams)` to resolve the active value. Query parameters in the form `variant.<surface>=<variant>` can override a valid variant for preview and development, for example:

```text
/en/posts/example?variant.article.toc=progress-map
```

Invalid stored values and invalid overrides fall back to the surface default.

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
        description: 'A larger banner with supporting metadata.',
        id: 'feature',
        label: 'Feature',
      },
    ],
  },
}
```

Keep IDs stable once content editors can save them. Renaming a surface or variant is a data migration.

## Rendering A Configurable Slot

Resolve the selected variant in the route or server component that owns the page composition:

```tsx
const bannerVariant = await getFrontendVariant('example.banner', searchParams)
```

Create a renderer map and pass it to `FrontendVariantSlot`.

```tsx
const bannerRenderers = {
  compact: CompactBanner,
  feature: FeatureBanner,
} satisfies FrontendVariantRendererMap<'example.banner', BannerProps>

export function ExampleBannerSlot(props: BannerProps & { variant: ExampleBannerVariantID }) {
  const { variant, ...slotProps } = props

  return (
    <FrontendVariantSlot
      renderers={bannerRenderers}
      slotProps={slotProps}
      surface="example.banner"
      variant={variant}
    />
  )
}
```

Renderer components should share the same props for a surface. Variant-specific data should come from code, resolved site/post data, or a dedicated content schema, not from arbitrary admin JSON.

## Verification

When adding or changing a frontend variant surface:

- Add model tests for registry defaults, lookup resolution, invalid values, and query overrides.
- Add rendering tests for the slot or component dispatcher.
- Run `pnpm run generate:types` after schema changes.
- Run `pnpm run generate:importmap` after adding or moving admin components.
- Run `pnpm exec tsc --noEmit` and the relevant integration tests.
