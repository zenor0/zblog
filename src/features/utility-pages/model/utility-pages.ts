import type { Post } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'

import { defaultLocale, normalizeLocale } from '@/shared/i18n/locales'

export const utilityPageSlugs = [
  'posts',
  'archive',
  'projects',
] as const

export type UtilityPageSlug = (typeof utilityPageSlugs)[number]

export type UtilityPageSection = {
  body: string[]
  title: string
}

export type UtilityPageCopy = {
  archiveCountLabel?: string
  description: string
  effectiveDateLabel?: string
  emptyState?: string
  eyebrow: string
  metaDescription: string
  sections: UtilityPageSection[]
  title: string
  updatedLabel?: string
}

export type UtilityPageSitemapConfig = {
  changeFrequency: 'daily' | 'monthly' | 'weekly'
  priority: number
  slug: UtilityPageSlug
}

export type PostArchiveGroup = {
  posts: Post[]
  year: string
}

const utilityPageCopyByLocale = {
  en: {
    archive: {
      archiveCountLabel: 'published entries',
      description: 'Browse published posts by year.',
      emptyState: 'No published posts are available yet.',
      eyebrow: 'Index',
      metaDescription: 'A year-by-year archive of published ZBlog posts.',
      sections: [],
      title: 'Archive',
      updatedLabel: 'Updated',
    },
    posts: {
      description:
        'All published articles, notes, and project updates in reverse chronological order.',
      emptyState: 'No published posts are available yet.',
      eyebrow: 'Index',
      metaDescription: 'All published posts on ZBlog.',
      sections: [],
      title: 'Posts',
      updatedLabel: 'Published',
    },
    projects: {
      description: 'A lightweight place for project notes and ongoing work references.',
      emptyState: 'Project entries can be added here when they are ready to publish.',
      eyebrow: 'Work',
      metaDescription: 'Project notes and ongoing work references from ZBlog.',
      sections: [
        {
          body: [
            'This page is reserved for project summaries, experiments, and longer-running work that deserves a stable URL outside the article stream.',
            'For now, published posts remain the best way to follow current work.',
          ],
          title: 'Project index',
        },
      ],
      title: 'Projects',
    },
  },
  'zh-Hans': {
    archive: {
      archiveCountLabel: '篇已发布文章',
      description: '按年份浏览已发布文章。',
      emptyState: '目前还没有已发布文章。',
      eyebrow: '索引',
      metaDescription: 'ZBlog 已发布文章的年度归档。',
      sections: [],
      title: '归档',
      updatedLabel: '更新于',
    },
    posts: {
      description: '按时间倒序查看全部已发布文章、笔记和项目更新。',
      emptyState: '目前还没有已发布文章。',
      eyebrow: '索引',
      metaDescription: 'ZBlog 的全部已发布文章。',
      sections: [],
      title: '文章',
      updatedLabel: '发布于',
    },
    projects: {
      description: '用于放置项目笔记和持续工作的轻量入口。',
      emptyState: '项目条目准备好后，可以发布在这里。',
      eyebrow: '工作',
      metaDescription: 'ZBlog 的项目笔记和持续工作索引。',
      sections: [
        {
          body: [
            '这个页面预留给项目摘要、实验记录，以及那些值得拥有稳定链接、但不适合只放在文章流里的长期工作。',
            '目前，已发布文章仍然是了解近期工作的主要入口。',
          ],
          title: '项目索引',
        },
      ],
      title: '项目',
    },
  },
} as const satisfies Record<AppLocale, Record<UtilityPageSlug, UtilityPageCopy>>

export const utilityPageSitemapConfigs: UtilityPageSitemapConfig[] = [
  {
    changeFrequency: 'daily',
    priority: 0.8,
    slug: 'posts',
  },
  {
    changeFrequency: 'daily',
    priority: 0.6,
    slug: 'archive',
  },
  {
    changeFrequency: 'monthly',
    priority: 0.5,
    slug: 'projects',
  },
]

function getUtilityLocale(locale: AppLocale | null | string | undefined): AppLocale {
  return normalizeLocale(locale) ?? defaultLocale
}

export function getUtilityPageCopy(
  locale: AppLocale | null | string | undefined,
  slug: UtilityPageSlug,
): UtilityPageCopy {
  return utilityPageCopyByLocale[getUtilityLocale(locale)][slug]
}

export function buildUtilityPagePath(slug: UtilityPageSlug) {
  return `/${slug}`
}

export function getPostTimestamp(post: Post) {
  return post.publishedAt ?? post.updatedAt ?? post.createdAt ?? null
}

export function groupPostsByYear(posts: Post[]): PostArchiveGroup[] {
  const groups = new Map<string, Post[]>()

  posts.forEach((post) => {
    const timestamp = getPostTimestamp(post)
    const year = timestamp ? new Date(timestamp).getFullYear() : Number.NaN
    const key = Number.isFinite(year) ? String(year) : 'Undated'
    const group = groups.get(key) ?? []

    group.push(post)
    groups.set(key, group)
  })

  return [...groups.entries()]
    .sort(([firstYear], [secondYear]) => secondYear.localeCompare(firstYear))
    .map(([year, groupPosts]) => ({
      posts: groupPosts,
      year,
    }))
}
