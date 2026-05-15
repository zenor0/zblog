import { buildAbsoluteURL, buildSeoDescription } from '@/shared/content/seo'
import { getResolvedSiteSettings } from '@/features/site-settings/model/site-settings'
import { buildLocalePath, type AppLocale } from '@/shared/i18n/locales'
import { getPayloadClient } from '@/shared/payload/client'
import type { Post } from '@/payload-types'

export const rssContentType = 'application/rss+xml; charset=utf-8'
const rssCacheControl = 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600'
const defaultRSSLimit = 50

function hasText(value: null | string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function escapeXML(value: null | string | undefined) {
  return (value ?? '').replace(/[<>&"']/g, (character) => {
    switch (character) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      case "'":
        return '&apos;'
      default:
        return character
    }
  })
}

function toValidDate(value: null | string | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function toRSSDate(value: Date | null) {
  return (value ?? new Date()).toUTCString()
}

function getPostDate(post: Post) {
  return toValidDate(post.publishedAt) ?? toValidDate(post.updatedAt)
}

function getPostModifiedDate(post: Post) {
  return toValidDate(post.updatedAt) ?? getPostDate(post)
}

function getLastBuildDate(posts: Post[]) {
  const timestamps = posts
    .map((post) => getPostModifiedDate(post)?.getTime())
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  if (timestamps.length === 0) {
    return new Date()
  }

  return new Date(Math.max(...timestamps))
}

function normalizeSiteName(value: null | string | undefined) {
  return hasText(value) ? value.trim() : 'ZBlog'
}

function getPostURL(locale: AppLocale, post: Post) {
  return buildAbsoluteURL(buildLocalePath(locale, `/posts/${encodeURIComponent(post.slug.trim())}`))
}

function getPostDescription(post: Post) {
  return (
    buildSeoDescription({
      content: post.content,
      fallback: post.seo?.metaDescription,
      maxLength: 320,
      value: post.excerpt,
    }) ?? ''
  )
}

export function getRSSFeedPath(locale: AppLocale) {
  return buildLocalePath(locale, '/rss.xml')
}

export function isRSSFeedPost(post: null | Post): post is Post {
  return Boolean(
    post &&
    hasText(post.slug) &&
    hasText(post.title) &&
    hasText(post.content) &&
    !post.seo?.noindex,
  )
}

export async function getRSSFeedPosts(locale: AppLocale, limit = defaultRSSLimit): Promise<Post[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    depth: 0,
    fallbackLocale: false,
    limit,
    locale,
    overrideAccess: false,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs.filter(isRSSFeedPost)
}

export function buildRSSFeed(args: {
  locale: AppLocale
  posts: Post[]
  selfPath: string
  siteDescription?: null | string
  siteName: string
}) {
  const siteName = normalizeSiteName(args.siteName)
  const siteDescription = hasText(args.siteDescription) ? args.siteDescription.trim() : siteName
  const channelURL = buildAbsoluteURL(buildLocalePath(args.locale))
  const selfURL = buildAbsoluteURL(args.selfPath)
  const items = args.posts.map((post) => {
    const postURL = getPostURL(args.locale, post)
    const pubDate = getPostDate(post)
    const categories =
      post.tags
        ?.filter((tag) => hasText(tag?.value))
        .map((tag) => `    <category>${escapeXML(tag.value.trim())}</category>`)
        .join('\n') ?? ''

    return [
      '  <item>',
      `    <title>${escapeXML(post.title.trim())}</title>`,
      `    <link>${escapeXML(postURL)}</link>`,
      `    <guid isPermaLink="true">${escapeXML(postURL)}</guid>`,
      `    <description>${escapeXML(getPostDescription(post))}</description>`,
      pubDate ? `    <pubDate>${toRSSDate(pubDate)}</pubDate>` : null,
      categories || null,
      '  </item>',
    ]
      .filter((line): line is string => Boolean(line))
      .join('\n')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${escapeXML(siteName)}</title>`,
    `  <link>${escapeXML(channelURL)}</link>`,
    `  <description>${escapeXML(siteDescription)}</description>`,
    `  <language>${escapeXML(args.locale)}</language>`,
    `  <lastBuildDate>${toRSSDate(getLastBuildDate(args.posts))}</lastBuildDate>`,
    `  <atom:link href="${escapeXML(selfURL)}" rel="self" type="application/rss+xml" />`,
    ...items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}

export async function getRSSFeedResponse(args: { locale: AppLocale; selfPath?: string }) {
  const [settings, posts] = await Promise.all([
    getResolvedSiteSettings(args.locale),
    getRSSFeedPosts(args.locale),
  ])
  const xml = buildRSSFeed({
    locale: args.locale,
    posts,
    selfPath: args.selfPath ?? getRSSFeedPath(args.locale),
    siteDescription: settings.siteDescription,
    siteName: settings.siteName,
  })

  return new Response(xml, {
    headers: {
      'cache-control': rssCacheControl,
      'content-type': rssContentType,
    },
  })
}
