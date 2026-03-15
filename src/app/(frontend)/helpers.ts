import { notFound } from 'next/navigation'

import {
  buildLocalePath,
  defaultLocale,
  getLocaleLabel,
  normalizeLocale,
  supportedLocales,
  type AppLocale,
} from '@/lib/locales'

type FrontendCopy = {
  attachments: string
  backToArticle: string
  backToEditor: string
  backToIndex: string
  bibliographyMismatchIntro: string
  bibliographyMismatchTitle: string
  draftLabel: string
  editorialStatus: string
  emptyExcerpt: string
  exitPreview: string
  fallbackAfterResolved: string
  fallbackBeforeRequested: string
  fallbackBetweenLocales: string
  fallbackTitle: string
  heroDescription: string
  heroTitle: string
  latestSnapshot: string
  machineStatus: string
  machineTranslationAfterSource: string
  machineTranslationBeforeLocale: string
  machineTranslationBetweenLocales: string
  machineTranslationTitle: string
  noPublishedPosts: string
  noVersions: string
  postsHeading: string
  previewBody: string
  previewTitle: string
  publishedEntries: (count: number) => string
  publishedLabel: string
  readingTime: (minutes: number) => string
  referenceItem: string
  references: string
  siteLabel: string
  tags: string
  untitledDraft: string
  untitledPost: string
  unknownDate: string
  unscheduled: string
  versionHistory: string
  versionHistorySummary: (title: string, count: number) => string
  versionHistoryTitle: string
  versionID: string
}

const frontendCopy: Record<AppLocale, FrontendCopy> = {
  'zh-Hans': {
    attachments: '附件',
    backToArticle: '返回文章',
    backToEditor: '返回编辑器',
    backToIndex: '返回列表',
    bibliographyMismatchIntro: '缺少以下引用键',
    bibliographyMismatchTitle: '引用文献不匹配',
    draftLabel: '草稿',
    editorialStatus: '编辑整理',
    emptyExcerpt: '这篇文章暂时还没有摘要。',
    exitPreview: '退出预览',
    fallbackAfterResolved: ' 的源内容。',
    fallbackBeforeRequested: '由于 ',
    fallbackBetweenLocales: ' 版本内容不完整，当前改为展示 ',
    fallbackTitle: '回退语言',
    heroDescription:
      '基于 Payload，支持多语言文章、引用、附件与版本历史。界面尽量保持克制、清楚，把注意力留给内容本身。',
    heroTitle: '多语言文章、引用与版本记录。',
    latestSnapshot: '最新快照',
    machineStatus: '机器翻译',
    machineTranslationAfterSource: ' 自动生成，作为正式版本前请先人工校对。',
    machineTranslationBeforeLocale: '当前 ',
    machineTranslationBetweenLocales: ' 页面由 ',
    machineTranslationTitle: '机器翻译',
    noPublishedPosts: '还没有已发布文章。可以先在 Payload Admin 中创建并发布一篇。',
    noVersions: '目前还没有可用的版本快照。',
    postsHeading: '文章',
    previewBody: '当前看到的是这篇文章的草稿前台预览效果。',
    previewTitle: '预览模式',
    publishedEntries: (count) => `已发布 ${count} 篇`,
    publishedLabel: '已发布',
    readingTime: (minutes) => `${minutes} 分钟阅读`,
    referenceItem: '参考条目',
    references: '参考文献',
    siteLabel: 'ZBlog CMS',
    tags: '标签',
    untitledDraft: '未命名草稿',
    untitledPost: '未命名文章',
    unknownDate: '日期未知',
    unscheduled: '未安排',
    versionHistory: '版本历史',
    versionHistorySummary: (title, count) => `${title} · 共 ${count} 个版本`,
    versionHistoryTitle: '版本历史',
    versionID: '版本 ID',
  },
  en: {
    attachments: 'Attachments',
    backToArticle: 'Back to article',
    backToEditor: 'Back to editor',
    backToIndex: 'Back to index',
    bibliographyMismatchIntro: 'missing citation keys',
    bibliographyMismatchTitle: 'Bibliography mismatch',
    draftLabel: 'Draft',
    editorialStatus: 'Editorial',
    emptyExcerpt: 'No excerpt provided yet.',
    exitPreview: 'Exit preview',
    fallbackAfterResolved: ' source instead.',
    fallbackBeforeRequested: 'the ',
    fallbackBetweenLocales: ' version is incomplete, so this page is rendering the ',
    fallbackTitle: 'Fallback locale',
    heroDescription:
      'Built on Payload with multilingual posts, citations, attachments, and version history. The frontend stays restrained so the content, not the chrome, carries the page.',
    heroTitle: 'Multilingual posts, citations, and revision history.',
    latestSnapshot: 'Latest snapshot',
    machineStatus: 'Machine draft',
    machineTranslationAfterSource: '. Review before treating it as canonical.',
    machineTranslationBeforeLocale: 'this ',
    machineTranslationBetweenLocales: ' page was generated from ',
    machineTranslationTitle: 'Machine translation',
    noPublishedPosts: 'No published posts yet. Create one in Payload admin and publish it.',
    noVersions: 'No version snapshots are available yet.',
    postsHeading: 'Posts',
    previewBody: 'You are viewing the draft version of this article as it would render on the frontend.',
    previewTitle: 'Preview mode',
    publishedEntries: (count) => `${count} published entries`,
    publishedLabel: 'Published',
    readingTime: (minutes) => `${minutes} min read`,
    referenceItem: 'reference',
    references: 'References',
    siteLabel: 'ZBlog CMS',
    tags: 'Tags',
    untitledDraft: 'Untitled draft',
    untitledPost: 'Untitled post',
    unknownDate: 'Unknown date',
    unscheduled: 'Unscheduled',
    versionHistory: 'Version history',
    versionHistorySummary: (title, count) => `${title} · ${count} recorded versions`,
    versionHistoryTitle: 'Version history',
    versionID: 'Version ID',
  },
}

export function requireLocale(locale: string): AppLocale {
  const normalizedLocale = normalizeLocale(locale)

  if (!normalizedLocale) {
    notFound()
  }

  return normalizedLocale
}

export function formatLongDate(value: string | null | undefined, locale: AppLocale): string {
  if (!value) {
    return frontendCopy[locale].unscheduled
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatShortDate(value: string | null | undefined, locale: AppLocale): string {
  if (!value) {
    return frontendCopy[locale].unknownDate
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function estimateReadingTime(content: string, locale: AppLocale): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const cjkCharacters = (content.match(/[\u3400-\u9fff]/g) ?? []).length
  const estimatedUnits = Math.max(words, Math.round(cjkCharacters / 2))
  const minutes = Math.max(1, Math.round(estimatedUnits / 220))

  return frontendCopy[locale].readingTime(minutes)
}

export function getFrontendCopy(locale: AppLocale): FrontendCopy {
  return frontendCopy[locale]
}

export function buildLocaleLinks(pathname: string) {
  return supportedLocales.map((locale) => ({
    href: buildLocalePath(locale.code, pathname),
    isDefault: locale.code === defaultLocale,
    label: getLocaleLabel(locale.code),
    locale: locale.code,
  }))
}
