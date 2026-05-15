import { getRSSFeedResponse } from '@/features/rss/server/rss-feed'
import { defaultLocale } from '@/shared/i18n/locales'

export const dynamic = 'force-dynamic'

export async function GET() {
  return getRSSFeedResponse({
    locale: defaultLocale,
    selfPath: '/rss.xml',
  })
}
