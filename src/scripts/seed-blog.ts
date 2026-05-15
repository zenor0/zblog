import 'dotenv/config'

import fs from 'fs/promises'
import { performance } from 'node:perf_hooks'
import path from 'path'

import type { Payload } from 'payload'

import type { Media, Post, User } from '@/payload-types'
import { assertSafeLocalStateReset, getLocalStateResetPlan } from '@/shared/runtime/local-state-reset'
import {
  buildEnCitationDemoContent,
  buildEnMarkdownShowcaseContent,
  buildZhCitationDemoContent,
  buildZhCitationDemoContentV2,
  buildZhFallbackDemoContent,
  buildZhMarkdownShowcaseContent,
  seedCitationDemoCopy,
  seedCitationDemoSlug,
  seedCitationDemoRevisionCopy,
  seedFallbackDemoCopy,
  seedFallbackDemoSlug,
  seedMarkdownShowcaseCopy,
  seedMarkdownShowcaseEnTitle,
  seedMarkdownShowcaseSlug,
  seedMarkdownShowcaseZhTitle,
} from '@/features/posts/seed/seed-blog-content'
import { seedSiteSettings } from '@/features/site-settings/seed/seed-site-settings'
import { seedAssetsDir } from '@/shared/runtime/paths'

const seedDir = seedAssetsDir
const shouldLogTimings = process.env.ZBLOG_SEED_TIMING === 'true'
const shouldResetLocalState = process.argv.includes('--reset')

const heroSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title desc">
  <title id="title">ZBlog Seed Hero</title>
  <desc id="desc">A minimal geometric composition used for seeded blog posts.</desc>
  <rect width="1600" height="900" fill="#f4f1ea"/>
  <rect x="140" y="120" width="1320" height="660" rx="28" fill="#ffffff" stroke="#d8d0c4"/>
  <rect x="220" y="220" width="480" height="32" rx="16" fill="#1f1d1a" opacity="0.12"/>
  <rect x="220" y="286" width="960" height="22" rx="11" fill="#1f1d1a" opacity="0.08"/>
  <rect x="220" y="334" width="890" height="22" rx="11" fill="#1f1d1a" opacity="0.08"/>
  <rect x="220" y="382" width="760" height="22" rx="11" fill="#1f1d1a" opacity="0.08"/>
  <circle cx="1260" cy="300" r="120" fill="#e8b8a7"/>
  <circle cx="1170" cy="380" r="74" fill="#d36e45" opacity="0.85"/>
  <text x="220" y="525" font-family="Georgia, serif" font-size="92" fill="#1f1d1a">Citation-aware writing</text>
  <text x="220" y="618" font-family="Arial, sans-serif" font-size="34" fill="#6b655d">Seeded content for multilingual reading, attachments, and version history.</text>
</svg>
`

const attachmentText = `ZBlog seed attachment

This file is attached to the seeded post so you can verify attachment rendering from the frontend.
`

const bibliographyText = `@article{smith2024,
  author = {Smith, Jane and Doe, John},
  title = {Designing Blogs that Respect References},
  journal = {Journal of Digital Writing},
  year = {2024},
  volume = {12},
  number = {2},
  pages = {10--32}
}

@inproceedings{chen2023,
  author = {Chen, Alice},
  title = {Multilingual Publishing Pipelines},
  booktitle = {Proceedings of the Structured Content Conference},
  year = {2023},
  pages = {88--96}
}
`

async function ensureSeedAssets() {
  await fs.mkdir(seedDir, {
    recursive: true,
  })

  const heroPath = path.join(seedDir, 'seed-hero.svg')
  const attachmentPath = path.join(seedDir, 'seed-attachment.txt')

  await Promise.all([
    fs.writeFile(heroPath, heroSvg, 'utf8'),
    fs.writeFile(attachmentPath, attachmentText, 'utf8'),
  ])

  return {
    attachmentPath,
    heroPath,
  }
}

async function getSeedPayload() {
  const [{ getPayload }, configModule] = await Promise.all([
    import('payload'),
    import('@/payload.config'),
  ])

  return getPayload({
    config: await configModule.default,
  })
}

async function resetLocalState() {
  const plan = getLocalStateResetPlan()

  assertSafeLocalStateReset(plan)

  await fs.rm(plan.targetPath, {
    force: true,
    recursive: true,
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        reset: plan.label,
        targetPath: plan.targetPath,
      },
      null,
      2,
    ),
  )
}

async function backfillUserRoles(payload: Payload) {
  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 100,
  })

  const userCount = users.docs.length

  for (const user of users.docs as User[]) {
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      continue
    }

    const roles: User['roles'] = userCount <= 1 ? ['admin'] : ['editor']

    await payload.update({
      collection: 'users',
      data: {
        roles,
      },
      id: user.id,
    })
  }
}

async function deleteExistingSeedContent(payload: Payload) {
  await Promise.all([
    payload.delete({
      collection: 'posts',
      where: {
        slug: {
          in: [seedCitationDemoSlug, seedFallbackDemoSlug, seedMarkdownShowcaseSlug],
        },
      },
    }),
    payload.delete({
      collection: 'media',
      where: {
        alt: {
          in: ['Seed Hero Graphic', 'Seed Attachment File'],
        },
      },
    }),
  ])
}

async function createSeedFiles(
  payload: Payload,
  assetPaths: Awaited<ReturnType<typeof ensureSeedAssets>>,
) {
  const hero = (await payload.create({
    collection: 'media',
    data: {
      alt: 'Seed Hero Graphic',
      caption: 'Seed asset for previewing image rendering inside the blog frontend.',
      credit: 'Generated by local seed script',
    },
    filePath: assetPaths.heroPath,
  })) as Media

  const attachment = (await payload.create({
    collection: 'media',
    data: {
      alt: 'Seed Attachment File',
      caption: 'A plain text attachment used to test downloads.',
      credit: 'Local seed script',
    },
    filePath: assetPaths.attachmentPath,
  })) as Media

  return {
    attachment,
    bibliography: {
      filename: 'seed-citations.bib',
      source: bibliographyText,
    },
    hero,
  }
}

async function seedPosts(payload: Payload, files: Awaited<ReturnType<typeof createSeedFiles>>) {
  const citationPost = (await payload.create({
    collection: 'posts',
    data: {
      _status: 'published',
      attachments: [
        {
          description: 'Used to verify attachment rendering and download behavior.',
          file: files.attachment.id,
          label: 'Seed attachment',
        },
      ],
      bibliography: files.bibliography,
      content: buildZhCitationDemoContent(files.hero.url ?? ''),
      excerpt: seedCitationDemoCopy['zh-Hans'].excerpt,
      heroImage: files.hero.id,
      slug: seedCitationDemoSlug,
      tags: [{ value: 'payload' }, { value: 'citations' }, { value: 'seed' }],
      title: seedCitationDemoCopy['zh-Hans'].title,
    },
  })) as Post

  await payload.update({
    collection: 'posts',
    data: {
      content: buildZhCitationDemoContentV2(files.hero.url ?? ''),
      excerpt: seedCitationDemoRevisionCopy['zh-Hans'].excerpt,
      title: seedCitationDemoRevisionCopy['zh-Hans'].title,
    },
    id: citationPost.id,
    locale: 'zh-Hans',
  })

  await payload.update({
    collection: 'posts',
    data: {
      _status: 'published',
      content: buildEnCitationDemoContent(files.hero.url ?? ''),
      excerpt: seedCitationDemoCopy.en.excerpt,
      title: seedCitationDemoCopy.en.title,
      translatedAt: new Date().toISOString(),
      translatedFromLocale: 'zh-Hans',
      translationProvider: 'seed-script',
      translationStatus: 'machine',
    },
    id: citationPost.id,
    locale: 'en',
  })

  await payload.create({
    collection: 'posts',
    data: {
      _status: 'published',
      content: buildZhFallbackDemoContent(),
      excerpt: seedFallbackDemoCopy['zh-Hans'].excerpt,
      slug: seedFallbackDemoSlug,
      tags: [{ value: 'fallback' }, { value: 'locales' }],
      title: seedFallbackDemoCopy['zh-Hans'].title,
    },
  })

  const showcasePost = (await payload.create({
    collection: 'posts',
    data: {
      _status: 'published',
      bibliography: files.bibliography,
      content: buildZhMarkdownShowcaseContent(files.hero.url ?? ''),
      excerpt: seedMarkdownShowcaseCopy['zh-Hans'].excerpt,
      heroImage: files.hero.id,
      slug: seedMarkdownShowcaseSlug,
      tags: [{ value: 'markdown' }, { value: 'showcase' }, { value: 'seed' }],
      title: seedMarkdownShowcaseZhTitle,
    },
  })) as Post

  await payload.update({
    collection: 'posts',
    data: {
      _status: 'published',
      content: buildEnMarkdownShowcaseContent(files.hero.url ?? ''),
      excerpt: seedMarkdownShowcaseCopy.en.excerpt,
      title: seedMarkdownShowcaseEnTitle,
      translatedAt: new Date().toISOString(),
      translatedFromLocale: 'zh-Hans',
      translationProvider: 'seed-script',
      translationStatus: 'machine',
    },
    id: showcasePost.id,
    locale: 'en',
  })
}

async function logSummary(payload: Payload) {
  const posts = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 20,
    locale: 'zh-Hans',
    overrideAccess: false,
    sort: 'slug',
    where: {
      slug: {
        in: [seedCitationDemoSlug, seedFallbackDemoSlug, seedMarkdownShowcaseSlug],
      },
    },
  })

  const versions = await payload.findVersions({
    collection: 'posts',
    limit: 20,
    locale: 'zh-Hans',
    sort: '-updatedAt',
    where: {
      parent: {
        equals: posts.docs.find((post) => post.slug === 'seed-citation-demo')?.id,
      },
    },
  })

  console.log(
    JSON.stringify(
      {
        posts: posts.docs.map((post) => ({
          id: post.id,
          slug: post.slug,
          status: post._status,
          title: post.title,
        })),
        zhVersionCountForCitationPost: versions.totalDocs,
      },
      null,
      2,
    ),
  )
}

async function timed<T>(label: string, operation: () => Promise<T>): Promise<T> {
  const start = performance.now()

  try {
    return await operation()
  } finally {
    if (shouldLogTimings) {
      console.log(`${label}: ${Math.round(performance.now() - start)}ms`)
    }
  }
}

async function main() {
  let payload: Payload | null = null

  try {
    if (shouldResetLocalState) {
      await timed('reset local state', resetLocalState)
    }

    payload = await timed('init payload', getSeedPayload)
    const initializedPayload = payload

    await timed('backfill user roles', () => backfillUserRoles(initializedPayload))
    await timed('seed site settings', () => seedSiteSettings(initializedPayload))
    await timed('delete existing seed content', () => deleteExistingSeedContent(initializedPayload))

    const assetPaths = await timed('ensure seed assets', ensureSeedAssets)
    const files = await timed('create seed media', () =>
      createSeedFiles(initializedPayload, assetPaths),
    )

    await timed('seed posts', () => seedPosts(initializedPayload, files))
    await timed('log summary', () => logSummary(initializedPayload))
  } finally {
    await timed('destroy payload', async () => {
      await payload?.destroy()
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
