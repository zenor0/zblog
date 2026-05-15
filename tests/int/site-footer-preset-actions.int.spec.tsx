import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fieldStates: {} as Record<string, { setValue: ReturnType<typeof vi.fn>; value?: unknown }>,
  toastSuccess: vi.fn(),
}))

vi.mock('@payloadcms/ui', () => ({
  Button: (props: any) => (
    <button
      data-testid={props.extraButtonProps?.['data-testid']}
      onClick={props.onClick}
      type="button"
    >
      {props.children}
    </button>
  ),
  toast: {
    success: mocks.toastSuccess,
  },
  useField: ({ path }: { path: string }) => mocks.fieldStates[path],
  useLocale: () => ({ code: 'en' }),
}))

import { SiteFooterPresetActions } from '@/features/site-settings/admin/SiteFooterPresetActions'

describe('SiteFooterPresetActions', () => {
  afterEach(() => {
    Object.keys(mocks.fieldStates).forEach((key) => {
      delete mocks.fieldStates[key]
    })
    mocks.toastSuccess.mockClear()
  })

  it('applies the starter footer and preserves existing global variables', () => {
    mocks.fieldStates.footer = {
      setValue: vi.fn(),
      value: null,
    }
    mocks.fieldStates.globalVariables = {
      setValue: vi.fn(),
      value: {
        owner: {
          name: 'Real Owner',
        },
        socialLinks: [
          {
            label: '@real',
            platform: 'github',
            url: 'https://github.com/real',
          },
        ],
      },
    }

    render(
      <SiteFooterPresetActions
        field={{ name: 'footerPresetActions', type: 'ui' } as any}
        path="footerPresetActions"
      />,
    )

    fireEvent.click(screen.getByTestId('site-footer-apply-starter'))

    expect(mocks.fieldStates.footer.setValue).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutStyle: 'balanced',
        brand: expect.objectContaining({
          name: '{{site.name}}',
        }),
      }),
    )
    expect(mocks.fieldStates.globalVariables.setValue).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: expect.objectContaining({
          name: 'Real Owner',
          handle: '@your-id',
        }),
      }),
    )
    expect(mocks.fieldStates.globalVariables.setValue.mock.calls[0]?.[0].socialLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          platform: 'github',
          url: 'https://github.com/real',
        }),
        expect.objectContaining({
          platform: 'rss',
          url: '/rss.xml',
        }),
      ]),
    )
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Starter footer applied.')
  })
})
