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
        }),
      }),
    )
    expect(mocks.fieldStates.globalVariables.setValue.mock.calls[0]?.[0].socialLinks).toEqual([
      expect.objectContaining({
        platform: 'github',
        url: 'https://github.com/real',
      }),
    ])
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Starter footer applied.')
  })

  it('fills missing footer profile data from General without overwriting manual footer edits', () => {
    mocks.fieldStates.footer = {
      setValue: vi.fn(),
      value: {
        layoutStyle: 'balanced',
        brand: {
          name: 'Manual footer name',
          description: '',
          link: { type: 'internal', internalPath: '/', openInNewTab: false },
        },
        socialLinks: [
          {
            label: '@manual',
            platform: 'github',
            url: 'https://github.com/manual',
          },
        ],
        contactItems: [],
      },
    }
    mocks.fieldStates.globalVariables = {
      setValue: vi.fn(),
      value: {
        assets: {
          logo: 42,
        },
        contactItems: [
          {
            key: 'press',
            label: 'Press',
            value: 'press@example.com',
            url: 'mailto:press@example.com',
          },
        ],
        customVariables: [
          {
            key: 'tagline',
            value: 'Independent notes.',
          },
        ],
        owner: {
          email: 'owner@example.com',
        },
        socialLinks: [
          {
            label: '@manual',
            platform: 'github',
            url: 'https://github.com/manual',
          },
          {
            label: '@zblog',
            openInNewTab: true,
            platform: 'x',
            url: 'https://x.com/zblog',
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

    fireEvent.click(screen.getByTestId('site-footer-sync-general'))

    expect(mocks.fieldStates.footer.setValue).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: expect.objectContaining({
          description: '{{site.description}}',
          logo: 42,
          name: 'Manual footer name',
          supportingText: '{{custom.tagline}}',
        }),
        contactItems: [
          expect.objectContaining({
            label: '{{contact.press.label}}',
            value: '{{contact.press.value}}',
            link: expect.objectContaining({
              externalUrl: '{{contact.press.url}}',
              type: 'external',
            }),
          }),
        ],
        socialLinks: [
          expect.objectContaining({
            platform: 'github',
            url: 'https://github.com/manual',
          }),
          expect.objectContaining({
            label: '{{social.x.label}}',
            platform: 'x',
            url: '{{social.x.url}}',
          }),
        ],
      }),
    )
    expect(mocks.fieldStates.globalVariables.setValue).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Footer filled from General settings.')
  })
})
