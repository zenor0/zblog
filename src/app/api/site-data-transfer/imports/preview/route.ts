import { previewSiteDataImport } from '@/features/site-data-transfer/server/site-data-transfer-service'
import { getSiteDataTransferAdmin } from '@/features/site-data-transfer/server/api-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { error, payload, user } = await getSiteDataTransferAdmin(request)

  if (error || !user) {
    return error
  }

  const formData = await request.formData()
  const file = formData.get('package')

  if (!(file instanceof File)) {
    return Response.json(
      {
        message: 'Upload a zblog export ZIP.',
      },
      {
        status: 400,
      },
    )
  }

  try {
    return Response.json(
      await previewSiteDataImport({
        file,
        payload,
        user,
      }),
    )
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Import preview failed.',
      },
      {
        status: 400,
      },
    )
  }
}
