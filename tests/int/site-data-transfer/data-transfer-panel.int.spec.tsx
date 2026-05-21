import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock('@payloadcms/ui', () => ({
  Button: (props: any) => (
    <button disabled={props.disabled} onClick={props.onClick} type="button">
      {props.children}
    </button>
  ),
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}))

import { DataTransferPanel } from '@/features/site-data-transfer/admin/DataTransferPanel'

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    ...init,
  })
}

function getImportInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>(
    '.site-data-transfer__native-input[type="file"]',
  )

  if (!input) {
    throw new Error('Import file input was not rendered.')
  }

  return input
}

const noOpPreview = {
  diff: {
    groups: {
      'site-settings': {
        conflicts: 0,
        creates: 0,
        skips: 1,
        updates: 0,
        warnings: [],
      },
    },
  },
  manifest: {
    exportedAt: '2026-05-20T00:00:00.000Z',
    exportID: 'zblog-export-noop',
    groups: ['site-settings'],
    kind: 'zblog.siteDataExport',
    version: 1,
  },
  summary: {
    defaultSelectedGroups: [],
    hasChanges: false,
    totals: {
      conflicts: 0,
      creates: 0,
      skips: 1,
      updates: 0,
      warnings: 0,
    },
  },
  token: 'token-noop',
}

const changedPreview = {
  diff: {
    groups: {
      'site-settings': {
        conflicts: 0,
        creates: 0,
        skips: 0,
        updates: 1,
        warnings: [],
      },
    },
  },
  manifest: {
    exportedAt: '2026-05-20T00:00:00.000Z',
    exportID: 'zblog-export-changed',
    groups: ['site-settings'],
    kind: 'zblog.siteDataExport',
    version: 1,
  },
  summary: {
    defaultSelectedGroups: ['site-settings'],
    hasChanges: true,
    totals: {
      conflicts: 0,
      creates: 0,
      skips: 0,
      updates: 1,
      warnings: 0,
    },
  },
  token: 'token-changed',
}

describe('DataTransferPanel import flow', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mocks.toastError.mockClear()
    mocks.toastSuccess.mockClear()
  })

  it('commits a valid no-op import instead of requiring a selected group', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === '/api/site-data-transfer/exports' && !init?.method) {
        return jsonResponse({ files: [] })
      }

      if (url === '/api/site-data-transfer/imports/preview') {
        return jsonResponse(noOpPreview)
      }

      if (url === '/api/site-data-transfer/imports/token-noop/commit') {
        return jsonResponse({
          appliedGroups: [],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<DataTransferPanel />)

    fireEvent.change(getImportInput(container), {
      target: {
        files: [new File(['zip'], 'zblog-export-noop.zip', { type: 'application/zip' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview import' }))

    await screen.findByText('No changes detected. This export already matches the site.')
    fireEvent.click(screen.getByRole('button', { name: 'Finish import' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/site-data-transfer/imports/token-noop/commit',
        expect.objectContaining({
          body: JSON.stringify({ groups: [] }),
          method: 'POST',
        }),
      )
    })
    expect(mocks.toastError).not.toHaveBeenCalledWith('Select at least one group to import.')
    expect(mocks.toastSuccess).toHaveBeenCalledWith('No changes to import.')
  })

  it('still blocks changed imports when every group is deselected', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === '/api/site-data-transfer/exports' && !init?.method) {
        return jsonResponse({ files: [] })
      }

      if (url === '/api/site-data-transfer/imports/preview') {
        return jsonResponse(changedPreview)
      }

      if (url.includes('/commit')) {
        throw new Error('Changed import should not commit with no selected groups.')
      }

      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<DataTransferPanel />)

    fireEvent.change(getImportInput(container), {
      target: {
        files: [new File(['zip'], 'zblog-export-changed.zip', { type: 'application/zip' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview import' }))

    const previewTitle = await screen.findByText('zblog-export-changed')
    const preview = previewTitle.closest('.site-data-transfer__preview')

    if (!preview) {
      throw new Error('Import preview was not rendered.')
    }

    const groupCheckbox = within(preview as HTMLElement).getByRole('checkbox', {
      name: /Site settings/i,
    })
    fireEvent.click(groupCheckbox)
    fireEvent.click(screen.getByRole('button', { name: 'Import selected groups' }))

    expect(mocks.toastError).toHaveBeenCalledWith('Select at least one group to import.')
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/site-data-transfer/imports/token-changed/commit',
      expect.anything(),
    )
  })
})
