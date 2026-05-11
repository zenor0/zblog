import { APIError, type Endpoint } from 'payload'

import { isEditor } from '@/shared/auth/access'
import { defaultLocale, normalizeLocale } from '@/shared/i18n/locales'
import { isTranslationConfigured, translateFields } from '@/shared/i18n/translation'

type RequestBody = {
  sourceLocale?: string
  targetLocale?: string
}

export const autoTranslatePostEndpoint: Endpoint = {
  handler: async (req) => {
    if (!isEditor(req.user)) {
      throw new APIError('Unauthorized', 401)
    }

    if (!isTranslationConfigured()) {
      throw new APIError(
        'Automatic translation is not configured. Set TRANSLATION_API_URL to enable it.',
        501,
      )
    }

    const id = req.routeParams?.id as string | number | undefined

    if (!id) {
      throw new APIError('Post ID is required.', 400)
    }

    const body = ((await req.json?.().catch(() => ({}))) ?? {}) as RequestBody
    const sourceLocale = normalizeLocale(body.sourceLocale) ?? defaultLocale
    const targetLocale = normalizeLocale(body.targetLocale)

    if (!targetLocale) {
      throw new APIError('Invalid locale.', 400)
    }

    if (sourceLocale === targetLocale) {
      throw new APIError('Source locale and target locale must be different.', 400)
    }

    const sourcePost = await req.payload.findByID({
      collection: 'posts',
      depth: 0,
      fallbackLocale: false,
      id,
      locale: sourceLocale,
      overrideAccess: false,
      req,
    })

    if (!sourcePost.title || !sourcePost.content) {
      throw new APIError(
        `The source locale "${sourceLocale}" is missing title or content, so it cannot be translated.`,
        400,
      )
    }

    const translated = await translateFields({
      fields: {
        content: sourcePost.content,
        excerpt: sourcePost.excerpt,
        title: sourcePost.title,
      },
      sourceLocale,
      targetLocale,
    })

    const translatedPost = await req.payload.update({
      collection: 'posts',
      data: {
        content: translated.content,
        excerpt: translated.excerpt,
        title: translated.title,
        translatedAt: new Date().toISOString(),
        translatedFromLocale: sourceLocale,
        translationProvider: translated.provider,
        translationStatus: 'machine',
      },
      draft: sourcePost._status !== 'published',
      fallbackLocale: false,
      id,
      locale: targetLocale,
      overrideAccess: false,
      req,
    })

    return Response.json({
      doc: translatedPost,
      ok: true,
    })
  },
  method: 'post',
  path: '/:id/auto-translate',
}
