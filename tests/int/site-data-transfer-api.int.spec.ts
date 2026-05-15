import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const getPayloadMock = vi.fn(async () => ({
  auth: authMock,
}))
const createSiteDataExportMock = vi.fn()

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('payload', () => ({
  getPayload: getPayloadMock,
}))

vi.mock('@/features/site-data-transfer/server/site-data-transfer-service', () => ({
  createSiteDataExport: createSiteDataExportMock,
}))

describe('site data transfer API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects export requests from non-admin users', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 2,
        roles: ['editor'],
      },
    })

    const { POST } = await import('@/app/api/site-data-transfer/exports/route')
    const response = await POST(
      new Request('http://localhost/api/site-data-transfer/exports', {
        body: JSON.stringify({
          groups: ['site-settings'],
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )

    expect(response.status).toBe(403)
    expect(createSiteDataExportMock).not.toHaveBeenCalled()
  })

  it('starts an export for admin users', async () => {
    const adminUser = {
      id: 1,
      roles: ['admin'],
    }

    authMock.mockResolvedValue({
      user: adminUser,
    })
    createSiteDataExportMock.mockResolvedValue({
      file: {
        downloadURL: '/api/site-data-transfer/exports/zblog-export-test.zip',
        id: 'zblog-export-test.zip',
        size: 512,
      },
      manifest: {
        exportedAt: '2026-05-15T00:00:00.000Z',
        exportID: 'zblog-export-test',
        groups: ['site-settings'],
        kind: 'zblog.siteDataExport',
        version: 1,
      },
    })

    const { POST } = await import('@/app/api/site-data-transfer/exports/route')
    const response = await POST(
      new Request('http://localhost/api/site-data-transfer/exports', {
        body: JSON.stringify({
          groups: ['site-settings'],
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(createSiteDataExportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        groups: ['site-settings'],
        user: adminUser,
      }),
    )
    expect(body.file.downloadURL).toBe('/api/site-data-transfer/exports/zblog-export-test.zip')
  })
})
