import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  FrontendVariantSlot,
  type FrontendVariantRendererMap,
} from '@/features/frontend-variants/ui/FrontendVariantSlot'

type TocSlotProps = {
  config?: {
    pathStyle?: string
  }
  label: string
}

const tocRenderers = {
  'progress-map': ({ config, label }: TocSlotProps) => (
    <div data-path-style={config?.pathStyle} data-slot-variant="progress-map">
      {label}
    </div>
  ),
  standard: ({ label }: TocSlotProps) => <div data-slot-variant="standard">{label}</div>,
} satisfies FrontendVariantRendererMap<'article.toc', TocSlotProps>

describe('frontend variant slot', () => {
  it('renders the renderer selected by the resolved variant', () => {
    const html = renderToStaticMarkup(
      <FrontendVariantSlot
        renderers={tocRenderers}
        config={{ pathStyle: 'flow' }}
        slotProps={{ label: 'Contents' }}
        surface="article.toc"
        variant="progress-map"
      />,
    )

    expect(html).toContain('data-slot-variant="progress-map"')
    expect(html).toContain('data-path-style="flow"')
    expect(html).toContain('Contents')
  })

  it('falls back to the surface default renderer if a runtime map is incomplete', () => {
    const html = renderToStaticMarkup(
      <FrontendVariantSlot
        renderers={
          {
            standard: tocRenderers.standard,
          } as FrontendVariantRendererMap<'article.toc', TocSlotProps>
        }
        slotProps={{ label: 'Contents' }}
        surface="article.toc"
        variant="progress-map"
      />,
    )

    expect(html).toContain('data-slot-variant="standard"')
  })
})
