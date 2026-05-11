export type TranslationFields = {
  content: string
  excerpt?: string | null
  title: string
}

export type TranslationResult = TranslationFields & {
  provider: string
}

const translationApiUrl = process.env.TRANSLATION_API_URL
const translationApiKey = process.env.TRANSLATION_API_KEY

export function isTranslationConfigured(): boolean {
  return Boolean(translationApiUrl)
}

export async function translateFields(args: {
  fields: TranslationFields
  sourceLocale: string
  targetLocale: string
}): Promise<TranslationResult> {
  const { fields, sourceLocale, targetLocale } = args

  if (!translationApiUrl) {
    throw new Error('TRANSLATION_API_URL is not configured.')
  }

  const response = await fetch(translationApiUrl, {
    body: JSON.stringify({
      fields,
      format: 'markdown',
      sourceLocale,
      targetLocale,
    }),
    headers: {
      'content-type': 'application/json',
      ...(translationApiKey
        ? {
            authorization: `Bearer ${translationApiKey}`,
          }
        : {}),
    },
    method: 'POST',
  })

  if (!response.ok) {
    const message = await response.text()

    throw new Error(message || `Translation provider responded with ${response.status}.`)
  }

  const payload = (await response.json()) as Partial<TranslationResult>

  return {
    content: typeof payload.content === 'string' ? payload.content : fields.content,
    excerpt: typeof payload.excerpt === 'string' ? payload.excerpt : fields.excerpt,
    provider: typeof payload.provider === 'string' ? payload.provider : 'custom-api',
    title: typeof payload.title === 'string' ? payload.title : fields.title,
  }
}
