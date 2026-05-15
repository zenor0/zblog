import {
  deleteSiteDataExportFile,
  getSiteDataExportFile,
} from '@/features/site-data-transfer/server/site-data-transfer-service'
import { getSiteDataTransferAdmin } from '@/features/site-data-transfer/server/api-auth'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: Request, context: RouteContext) {
  const { error } = await getSiteDataTransferAdmin(request)

  if (error) {
    return error
  }

  const { id } = await context.params
  const deleted = await deleteSiteDataExportFile(id)

  return Response.json({
    deleted,
  })
}

export async function GET(request: Request, context: RouteContext) {
  const { error } = await getSiteDataTransferAdmin(request)

  if (error) {
    return error
  }

  const { id } = await context.params
  const file = await getSiteDataExportFile(id)

  if (!file) {
    return Response.json(
      {
        message: 'Export file not found.',
      },
      {
        status: 404,
      },
    )
  }

  return new Response(file.bytes, {
    headers: {
      'content-disposition': `attachment; filename="${file.filename}"`,
      'content-type': 'application/zip',
    },
  })
}
