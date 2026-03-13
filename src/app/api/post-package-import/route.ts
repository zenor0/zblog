import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isEditor } from '@/lib/access'
import { isLocale } from '@/lib/locales'
import { importPostPackage, importPostWorkspace, type ImportPostOverrides } from '@/lib/post-package-import'
import type { User } from '@/payload-types'

function parseOverrides(formData: FormData): ImportPostOverrides {
  const slug = formData.get('slug')
  const locale = formData.get('locale')
  const title = formData.get('title')
  const excerpt = formData.get('excerpt')
  const status = formData.get('status')
  const overrides: ImportPostOverrides = {}

  if (typeof slug === 'string' && slug.trim()) {
    overrides.slug = slug.trim()
  }

  if (typeof locale === 'string' && isLocale(locale)) {
    overrides.locale = locale
  }

  if (typeof title === 'string' && title.trim()) {
    overrides.title = title.trim()
  }

  if (typeof excerpt === 'string' && excerpt.trim()) {
    overrides.excerpt = excerpt.trim()
  }

  if (status === 'draft' || status === 'published') {
    overrides.status = status
  }

  return overrides
}

export const POST = async (request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })
  const { user } = await payload.auth({
    headers: request.headers,
  })

  if (!user || !isEditor(user)) {
    return Response.json(
      {
        message: 'Forbidden.',
      },
      {
        status: 403,
      },
    )
  }
  const actingUser = (await payload.findByID({
    collection: 'users',
    depth: 0,
    id: user.id,
    overrideAccess: false,
    req: {
      user: user as User,
    } as any,
    user: user as User,
  })) as User

  const formData = await request.formData()
  const overrides = parseOverrides(formData)
  const uploadedPackage = formData.get('package')
  const workspaceFiles = formData.getAll('workspaceFiles')
  const workspacePaths = formData.get('workspacePaths')

  try {
    if (uploadedPackage instanceof File) {
      if (!uploadedPackage.name.toLowerCase().endsWith('.zip')) {
        return Response.json(
          {
            message: 'Only .zip uploads are supported for package import.',
          },
          {
            status: 400,
          },
        )
      }

      const result = await importPostPackage({
        file: uploadedPackage,
        overrides,
        payload,
        user: actingUser,
      })

      return Response.json({
        ok: true,
        result,
      })
    }

    if (workspaceFiles.length > 0) {
      const parsedPaths =
        typeof workspacePaths === 'string'
          ? ((JSON.parse(workspacePaths) as unknown[]).filter(
              (value): value is string => typeof value === 'string',
            ) ?? [])
          : []

      if (parsedPaths.length !== workspaceFiles.length) {
        return Response.json(
          {
            message: 'The uploaded workspace paths do not match the uploaded files.',
          },
          {
            status: 400,
          },
        )
      }

      const files = workspaceFiles.map((entry, index) => {
        if (!(entry instanceof File)) {
          throw new Error('Workspace upload contains an invalid file payload.')
        }

        return {
          file: entry,
          path: parsedPaths[index] ?? entry.name,
        }
      })

      const result = await importPostWorkspace({
        files,
        overrides,
        payload,
        user: actingUser,
      })

      return Response.json({
        ok: true,
        result,
      })
    }

    return Response.json({
      message: 'Upload either a .zip package or an mdship workspace folder.',
    }, {
      status: 400,
    })
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
