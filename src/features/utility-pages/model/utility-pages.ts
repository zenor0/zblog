import type { Post } from '@/payload-types'
import type { AppLocale } from '@/shared/i18n/locales'

import { defaultLocale, normalizeLocale } from '@/shared/i18n/locales'

export const utilityPageSlugs = [
  'posts',
  'archive',
  'about',
  'projects',
  'privacy',
  'terms',
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
    about: {
      description:
        'A concise note about the site, the writing scope, and how readers can understand this blog.',
      eyebrow: 'Site',
      metaDescription: 'About this bilingual blog and its editorial scope.',
      sections: [
        {
          body: [
            'ZBlog is a bilingual writing space for technical notes, product thinking, and durable references from everyday work.',
            'The site is intentionally small: published posts remain the primary surface, while this page records the context behind the writing.',
          ],
          title: 'What this site is for',
        },
        {
          body: [
            'Most articles are written as working notes first, then refined into references that can be revisited later.',
            'When a post is translated or machine-assisted, the article page marks that status so readers can judge the source context.',
          ],
          title: 'Editorial approach',
        },
      ],
      title: 'About',
    },
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
    privacy: {
      description:
        'This policy describes the basic information practices for this site and can be replaced with formal legal copy when needed.',
      effectiveDateLabel: 'Effective date: 2026-05-16',
      eyebrow: 'Legal',
      metaDescription: 'Privacy policy for ZBlog.',
      sections: [
        {
          body: [
            'This site is primarily a public content site. It may process technical request data such as IP-derived request metadata, browser information, timestamps, and pages requested so the service can be delivered and protected.',
            'If you contact the site owner, the information you choose to provide may be used to respond to that message.',
          ],
          title: 'Information we may process',
        },
        {
          body: [
            'Information is used to operate the site, maintain security, understand basic site health, and improve published content.',
            'This template policy should be reviewed and adjusted before the site is used for a business, newsletter, account system, analytics program, or paid service.',
          ],
          title: 'How information is used',
        },
        {
          body: [
            'The site may link to third-party services, repositories, documentation, or embedded resources. Those services are governed by their own policies.',
            'If cookies, analytics, comments, payments, or accounts are enabled later, this page should be updated before those features are launched.',
          ],
          title: 'Third-party services',
        },
      ],
      title: 'Privacy Policy',
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
    terms: {
      description:
        'These terms provide a simple baseline for using this site and can be replaced with formal legal copy when needed.',
      effectiveDateLabel: 'Effective date: 2026-05-16',
      eyebrow: 'Legal',
      metaDescription: 'Terms of use for ZBlog.',
      sections: [
        {
          body: [
            'By using this site, you agree to access it lawfully and avoid disrupting its operation or attempting to access private administrative surfaces.',
            'Content is provided for general informational purposes and may change without notice.',
          ],
          title: 'Use of the site',
        },
        {
          body: [
            'Unless otherwise stated, articles and site materials belong to their respective authors or rights holders.',
            'Short references with attribution are welcome, but copying substantial portions of the site should require permission from the owner.',
          ],
          title: 'Content and rights',
        },
        {
          body: [
            'External links are provided as references. The site owner is not responsible for the content, availability, or policies of third-party destinations.',
            'These template terms should be reviewed and adjusted before the site is used for commercial services, user accounts, paid products, or community features.',
          ],
          title: 'External links and changes',
        },
      ],
      title: 'Terms of Use',
    },
  },
  'zh-Hans': {
    about: {
      description: '这里简要说明本站的定位、写作范围，以及读者可以如何理解这个博客。',
      eyebrow: '站点',
      metaDescription: '关于这个双语博客及其内容范围。',
      sections: [
        {
          body: [
            'ZBlog 是一个双语写作空间，用来沉淀技术笔记、产品思考，以及日常工作中值得长期引用的资料。',
            '站点保持轻量：已发布文章是主要内容入口，这个页面只补充说明写作背景。',
          ],
          title: '这个站点用来做什么',
        },
        {
          body: [
            '多数文章会先作为工作笔记写下，再整理成以后可以回看的参考内容。',
            '如果文章经过翻译或机器辅助生成，文章页会标注对应状态，方便读者判断内容来源。',
          ],
          title: '内容方式',
        },
      ],
      title: '关于',
    },
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
    privacy: {
      description: '本政策说明本站的基础信息处理方式。正式上线前可替换为经过确认的法律文本。',
      effectiveDateLabel: '生效日期：2026-05-16',
      eyebrow: '法律',
      metaDescription: 'ZBlog 的隐私政策。',
      sections: [
        {
          body: [
            '本站主要是公开内容站点。为提供和保护服务，站点可能处理请求相关的技术信息，例如由 IP 派生的请求元数据、浏览器信息、访问时间和请求页面。',
            '如果你主动联系站点所有者，你提供的信息可能会被用于回复该消息。',
          ],
          title: '我们可能处理的信息',
        },
        {
          body: [
            '这些信息用于运行站点、维护安全、了解基础服务状态，以及改进已发布内容。',
            '如果本站后续用于商业服务、邮件订阅、账号系统、统计分析或付费功能，应先审查并更新这份模板政策。',
          ],
          title: '信息如何使用',
        },
        {
          body: [
            '本站可能链接到第三方服务、代码仓库、文档或嵌入资源。这些服务适用其各自的政策。',
            '如果后续启用 Cookie、分析、评论、支付或账号功能，应在上线前同步更新本页面。',
          ],
          title: '第三方服务',
        },
      ],
      title: '隐私政策',
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
    terms: {
      description: '这些条款提供使用本站的基础说明。正式上线前可替换为经过确认的法律文本。',
      effectiveDateLabel: '生效日期：2026-05-16',
      eyebrow: '法律',
      metaDescription: 'ZBlog 的用户协议。',
      sections: [
        {
          body: [
            '访问本站即表示你同意以合法方式使用本站，不干扰其运行，也不尝试访问非公开的管理界面。',
            '站点内容仅用于一般信息参考，可能会不定期调整。',
          ],
          title: '使用本站',
        },
        {
          body: [
            '除非另有说明，文章和站点材料归对应作者或权利人所有。',
            '带署名的短引用通常是可以接受的，但复制本站大段内容前应获得所有者许可。',
          ],
          title: '内容与权利',
        },
        {
          body: [
            '外部链接仅作为参考提供。站点所有者不对第三方目标的内容、可用性或政策负责。',
            '如果本站后续用于商业服务、用户账号、付费产品或社区功能，应先审查并更新这份模板条款。',
          ],
          title: '外部链接与变更',
        },
      ],
      title: '用户协议',
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
    slug: 'about',
  },
  {
    changeFrequency: 'monthly',
    priority: 0.5,
    slug: 'projects',
  },
  {
    changeFrequency: 'monthly',
    priority: 0.2,
    slug: 'privacy',
  },
  {
    changeFrequency: 'monthly',
    priority: 0.2,
    slug: 'terms',
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
