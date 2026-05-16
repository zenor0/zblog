import type { AppLocale } from '@/shared/i18n/locales'

export const seedProjectSlugs = ['zblog-project-system', 'payload-publishing-workbench'] as const

export type SeedProjectSlug = (typeof seedProjectSlugs)[number]

export type SeedProjectLocaleCopy = {
  details: string
  summary: string
  title: string
}

export const seedProjectCopy = {
  'payload-publishing-workbench': {
    en: {
      details:
        'A publishing workbench that keeps editorial content, media ownership, citations, and preview states close to the Payload data model.\n\nThe project is intentionally small, but it exercises the same patterns used by production content teams: localized drafts, stable preview routes, and careful access control.',
      summary:
        'A Payload-backed publishing workflow for articles, media, citations, and localized previews.',
      title: 'Payload Publishing Workbench',
    },
    'zh-Hans': {
      details:
        '这是一个基于 Payload 的发布工作台，把文章内容、媒体归属、引用文献和预览状态都放在清晰的数据模型附近。\n\n项目保持轻量，但覆盖了内容团队常见的关键链路：多语言草稿、稳定预览路由，以及严格的访问控制。',
      summary: '围绕 Payload 构建的文章、媒体、引用和多语言预览发布流程。',
      title: 'Payload 发布工作台',
    },
  },
  'zblog-project-system': {
    en: {
      details:
        'ZBlog collects the frontend, article rendering, footer configuration, and admin tools into a compact bilingual publishing system.\n\nThe current project surface highlights the site architecture without forcing long-form project updates into the article stream.',
      summary:
        'The bilingual blog system behind this site, including editorial UI and Payload-backed configuration.',
      title: 'ZBlog Project System',
    },
    'zh-Hans': {
      details:
        'ZBlog 把前台体验、文章渲染、页脚配置和后台工具组织成一个紧凑的双语发布系统。\n\n当前项目入口用于展示站点架构和持续工作，不必把所有项目更新都放进文章流里。',
      summary: '支撑本站的双语博客系统，包含编辑型前台体验和 Payload 配置能力。',
      title: 'ZBlog 项目系统',
    },
  },
} as const satisfies Record<SeedProjectSlug, Record<AppLocale, SeedProjectLocaleCopy>>
