import { getRSSFeedResponse } from '@/features/rss/server/rss-feed'
import { requireLocale } from '@/i18n/routing'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, props: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await props.params
  const locale = requireLocale(localeParam)

  return getRSSFeedResponse({
    locale,
  })
}
