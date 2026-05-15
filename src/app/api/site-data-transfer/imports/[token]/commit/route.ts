import { commitSiteDataImport } from '@/features/site-data-transfer/server/site-data-transfer-service'
import { getSiteDataTransferAdmin } from '@/features/site-data-transfer/server/api-auth'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{
    token: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const { error, payload, user } = await getSiteDataTransferAdmin(request)

  if (error || !user) {
    return error
  }

  const { token } = await context.params
  const body = (await request.json().catch(() => ({}))) as {
    groups?: unknown
  }

  try {
    return Response.json(
      await commitSiteDataImport({
        groups: body.groups,
        payload,
        token,
        user,
      }),
    )
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Import failed.',
      },
      {
        status: 400,
      },
    )
  }
}
