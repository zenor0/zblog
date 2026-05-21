import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Page, Post, SiteSetting } from '@/payload-types'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  getPayloadClient: vi.fn(),
}))
const siteSettingsMocks = vi.hoisted(() => ({
  getResolvedSiteSettings: vi.fn(),
}))

vi.mock('@/shared/payload/client', () => ({
  getPayloadClient: payloadMocks.getPayloadClient,
}))
vi.mock('@/features/site-settings/model/site-settings', () => ({
  getResolvedSiteSettings: siteSettingsMocks.getResolvedSiteSettings,
}))

import { GET as getLocalizedRSS } from '@/app/(frontend)/[locale]/rss.xml/route'
import { GET as getRootRSS } from '@/app/rss.xml/route'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { publishedListedPostWhere } from '@/features/posts/model/post-visibility'
import { buildRSSFeed, getRSSFeedPosts } from '@/features/rss/server/rss-feed'

const originalSiteURL = process.env.NEXT_PUBLIC_SITE_URL

function postFixture(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    title: 'Visible post',
    slug: 'visible-post',
    excerpt: 'A short post summary.',
    content: '# Visible post\n\nThis is the full **markdown** content.',
    tags: [
      {
        id: 'tag-1',
        value: 'Payload',
      },
    ],
    publishedAt: '2026-03-23T12:00:00.000Z',
    updatedAt: '2026-03-24T12:00:00.000Z',
    createdAt: '2026-03-22T12:00:00.000Z',
    _status: 'published',
    visibility: 'listed',
    ...overrides,
  } as Post
}

function pageFixture(overrides: Partial<Page> = {}): Page {
  return {
    id: 10,
    content: '## Policy\n\nEditable page content.',
    createdAt: '2026-03-20T12:00:00.000Z',
    description: 'Editable page summary.',
    publishedAt: '2026-03-25T12:00:00.000Z',
    slug: 'privacy',
    title: 'Privacy Policy',
    updatedAt: '2026-03-25T12:00:00.000Z',
    _status: 'published',
    ...overrides,
  } as Page
}

function siteSettingsFixture(overrides: Partial<SiteSetting> = {}): SiteSetting {
  return {
    id: 1,
    siteName: 'ZBlog',
    siteDescription: 'Notes about building products.',
    siteURL: 'https://zblog.example',
    updatedAt: '2026-03-25T12:00:00.000Z',
    createdAt: '2026-03-20T12:00:00.000Z',
    ...overrides,
  } as SiteSetting
}

describe('RSS feed and discovery routes', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    payloadMocks.find.mockReset()
    payloadMocks.getPayloadClient.mockReset()
    siteSettingsMocks.getResolvedSiteSettings.mockReset()
    payloadMocks.getPayloadClient.mockResolvedValue({
      find: payloadMocks.find,
    })
    siteSettingsMocks.getResolvedSiteSettings.mockResolvedValue(siteSettingsFixture())
  })

  afterEach(() => {
    if (originalSiteURL === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteURL
    }
  })

  it('builds escaped RSS XML with channel metadata, links, summaries, and categories', () => {
    const xml = buildRSSFeed({
      locale: 'en',
      posts: [
        postFixture({
          title: 'One <Post> & Notes',
          excerpt: 'Intro & summary for RSS readers.',
          tags: [
            {
              id: 'tag-1',
              value: 'SEO & feeds',
            },
          ],
        }),
      ],
      selfPath: '/en/rss.xml',
      siteDescription: 'Notes <tech> & products.',
      siteName: 'Z & Blog',
      siteURL: 'https://zblog.example',
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"')
    expect(xml).toContain('<title>Z &amp; Blog</title>')
    expect(xml).toContain('<description>Notes &lt;tech&gt; &amp; products.</description>')
    expect(xml).toContain(
      '<atom:link href="https://zblog.example/en/rss.xml" rel="self" type="application/rss+xml" />',
    )
    expect(xml).toContain('<title>One &lt;Post&gt; &amp; Notes</title>')
    expect(xml).toContain('<link>https://zblog.example/en/posts/visible-post</link>')
    expect(xml).toContain('<description>Intro &amp; summary for RSS readers.</description>')
    expect(xml).toContain('<category>SEO &amp; feeds</category>')
    expect(xml).toContain('<pubDate>Mon, 23 Mar 2026 12:00:00 GMT</pubDate>')
    expect(xml).not.toContain('**markdown**')
  })

  it('queries published posts with access checks and filters non-indexable or incomplete posts', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        postFixture(),
        postFixture({
          id: 2,
          seo: {
            noindex: true,
          },
          slug: 'hidden-post',
        }),
        postFixture({
          id: 3,
          content: '',
          slug: 'empty-post',
        }),
        postFixture({
          id: 4,
          slug: 'unlisted-post',
          visibility: 'unlisted',
        }),
        postFixture({
          id: 5,
          slug: 'private-post',
          visibility: 'private',
        }),
      ],
    })

    const posts = await getRSSFeedPosts('en')

    expect(posts.map((post) => post.slug)).toEqual(['visible-post'])
    expect(payloadMocks.find).toHaveBeenCalledWith({
      collection: 'posts',
      depth: 0,
      fallbackLocale: false,
      limit: 50,
      locale: 'en',
      overrideAccess: false,
      sort: '-publishedAt',
      where: publishedListedPostWhere,
    })
  })

  it('serves root and localized RSS route responses', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [postFixture()],
    })

    const rootResponse = await getRootRSS()
    const rootXML = await rootResponse.text()

    expect(rootResponse.status).toBe(200)
    expect(rootResponse.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8')
    expect(rootResponse.headers.get('cache-control')).toContain('s-maxage')
    expect(rootXML).toContain(
      '<atom:link href="https://zblog.example/rss.xml" rel="self" type="application/rss+xml" />',
    )
    expect(rootXML).toContain('<link>https://zblog.example/zh-hans/posts/visible-post</link>')

    const localizedResponse = await getLocalizedRSS(
      new Request('https://zblog.example/en/rss.xml'),
      {
        params: Promise.resolve({ locale: 'en' }),
      },
    )
    const localizedXML = await localizedResponse.text()

    expect(localizedXML).toContain(
      '<atom:link href="https://zblog.example/en/rss.xml" rel="self" type="application/rss+xml" />',
    )
    expect(localizedXML).toContain('<link>https://zblog.example/en/posts/visible-post</link>')
  })

  it('adds sitemap metadata, locale alternates, and excludes noindex posts', async () => {
    payloadMocks.find.mockImplementation(
      ({ collection, locale }: { collection: string; locale: string }) => {
        if (collection === 'pages') {
          return Promise.resolve({
            docs: [
              pageFixture({
                slug: 'privacy',
                title: locale === 'en' ? 'Privacy Policy' : '隐私政策',
              }),
              pageFixture({
                id: 11,
                slug: 'terms',
                title: locale === 'en' ? 'Terms of Use' : '用户协议',
              }),
              pageFixture({
                id: 12,
                seo: {
                  noindex: true,
                },
                slug: 'hidden-page',
              }),
            ],
          })
        }

        if (collection === 'projects') {
          return Promise.resolve({
            docs: [],
          })
        }

        return Promise.resolve({
          docs: [
            postFixture({
              title: locale === 'en' ? 'Visible post' : '可见文章',
            }),
            postFixture({
              id: 2,
              seo: {
                noindex: true,
              },
              slug: 'hidden-post',
            }),
            postFixture({
              id: 3,
              slug: 'unlisted-post',
              visibility: 'unlisted',
            }),
            postFixture({
              id: 4,
              slug: 'private-post',
              visibility: 'private',
            }),
          ],
        })
      },
    )
    siteSettingsMocks.getResolvedSiteSettings.mockImplementation((locale: string) =>
      Promise.resolve(
        siteSettingsFixture({
          updatedAt: locale === 'en' ? '2026-03-26T12:00:00.000Z' : '2026-03-25T12:00:00.000Z',
        }),
      ),
    )

    const entries = await sitemap()
    const zhHome = entries.find((entry) => entry.url === 'https://zblog.example/zh-hans')
    const zhPrivacy = entries.find((entry) => entry.url === 'https://zblog.example/zh-hans/privacy')
    const enTerms = entries.find((entry) => entry.url === 'https://zblog.example/en/terms')
    const enPosts = entries.find((entry) => entry.url === 'https://zblog.example/en/posts')
    const enPost = entries.find(
      (entry) => entry.url === 'https://zblog.example/en/posts/visible-post',
    )

    expect(zhHome).toMatchObject({
      changeFrequency: 'daily',
      priority: 1,
      lastModified: '2026-03-25T12:00:00.000Z',
    })
    expect(zhHome?.alternates?.languages).toMatchObject({
      en: 'https://zblog.example/en',
      'x-default': 'https://zblog.example/zh-hans',
      'zh-Hans': 'https://zblog.example/zh-hans',
    })
    expect(zhPrivacy).toMatchObject({
      changeFrequency: 'monthly',
      priority: 0.2,
      lastModified: '2026-03-25T12:00:00.000Z',
    })
    expect(zhPrivacy?.alternates?.languages).toMatchObject({
      en: 'https://zblog.example/en/privacy',
      'x-default': 'https://zblog.example/zh-hans/privacy',
      'zh-Hans': 'https://zblog.example/zh-hans/privacy',
    })
    expect(enTerms).toMatchObject({
      changeFrequency: 'monthly',
      priority: 0.2,
    })
    expect(entries.some((entry) => entry.url.includes('hidden-page'))).toBe(false)
    expect(enPosts).toMatchObject({
      changeFrequency: 'daily',
      priority: 0.8,
    })
    expect(enPost).toMatchObject({
      changeFrequency: 'weekly',
      lastModified: '2026-03-24T12:00:00.000Z',
      priority: 0.7,
    })
    expect(enPost?.alternates?.languages).toMatchObject({
      en: 'https://zblog.example/en/posts/visible-post',
      'x-default': 'https://zblog.example/zh-hans/posts/visible-post',
      'zh-Hans': 'https://zblog.example/zh-hans/posts/visible-post',
    })
    expect(entries.some((entry) => entry.url.includes('hidden-post'))).toBe(false)
    expect(entries.some((entry) => entry.url.includes('unlisted-post'))).toBe(false)
    expect(entries.some((entry) => entry.url.includes('private-post'))).toBe(false)
  })

  it('keeps robots pointed at the sitemap while blocking private surfaces', async () => {
    const result = await robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules

    expect(result.host).toBe('https://zblog.example')
    expect(result.sitemap).toBe('https://zblog.example/sitemap.xml')
    expect(rule?.allow).toEqual(expect.arrayContaining(['/', '/api/og']))
    expect(rule?.disallow).toEqual(
      expect.arrayContaining(['/admin/', '/api/', '/preview/', '/*/preview/', '/dev/']),
    )
  })
})
