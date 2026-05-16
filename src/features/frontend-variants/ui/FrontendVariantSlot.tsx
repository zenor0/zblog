import { createElement, type ComponentType } from 'react'

import {
  frontendVariantRegistry,
  type FrontendVariantIDBySurface,
  type FrontendVariantSurfaceID,
} from '@/features/frontend-variants/model/frontend-variants'

export type FrontendVariantRendererMap<
  Surface extends FrontendVariantSurfaceID,
  Props extends object,
> = {
  [Variant in FrontendVariantIDBySurface[Surface]]: ComponentType<Props>
}

type FrontendVariantSlotProps<
  Surface extends FrontendVariantSurfaceID,
  Props extends object,
> = {
  renderers: FrontendVariantRendererMap<Surface, Props>
  slotProps: Props
  surface: Surface
  variant: FrontendVariantIDBySurface[Surface]
}

export function FrontendVariantSlot<
  Surface extends FrontendVariantSurfaceID,
  Props extends object,
>(props: FrontendVariantSlotProps<Surface, Props>) {
  const { renderers, slotProps, surface, variant } = props
  const defaultVariant = frontendVariantRegistry[surface]
    .defaultVariant as FrontendVariantIDBySurface[Surface]
  const Renderer = (renderers[variant] ?? renderers[defaultVariant]) as ComponentType<Props>

  return createElement(Renderer, slotProps)
}
