import {
  createSiteDataExport,
  listSiteDataExports,
} from '@/features/site-data-transfer/server/site-data-transfer-service'
import { getSiteDataTransferAdmin } from '@/features/site-data-transfer/server/api-auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { error } = await getSiteDataTransferAdmin(request)

  if (error) {
    return error
  }

  return Response.json({
    files: await listSiteDataExports(),
  })
}

export async function POST(request: Request) {
  const { error, payload, user } = await getSiteDataTransferAdmin(request)

  if (error || !user) {
    return error
  }

  const body = (await request.json().catch(() => ({}))) as {
    groups?: unknown
    preset?: string
  }
  const result = await createSiteDataExport({
    groups: body.groups,
    payload,
    preset: body.preset,
    user,
  })

  return Response.json(result)
}
