import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { PostViewDedupe } from './collections/PostViewDedupe'
import { PostViewMetrics } from './collections/PostViewMetrics'
import { FrontendVariants } from './globals/FrontendVariants'
import { SiteSettings } from './globals/SiteSettings'
import { migrations } from './migrations'
import { defaultLocale, payloadLocales } from './shared/i18n/locales'
import { ensureRuntimeDirectories } from './shared/runtime/directories'
import { getPayloadSecret } from './shared/runtime/env'
import { defaultDatabaseURL } from './shared/runtime/paths'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

ensureRuntimeDirectories()

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeNavLinks: [
        '/features/site-data-transfer/admin/DataTransferNavLink#DataTransferNavLink',
      ],
      views: {
        dataTransfer: {
          Component: '/features/site-data-transfer/admin/DataTransferView#DataTransferView',
          path: '/data-transfer',
        },
      },
    },
  },
  collections: [Users, Media, Posts, Projects, PostViewMetrics, PostViewDedupe],
  globals: [SiteSettings, FrontendVariants],
  editor: lexicalEditor(),
  localization: {
    defaultLocale,
    fallback: true,
    locales: payloadLocales,
  },
  secret: getPayloadSecret(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || defaultDatabaseURL,
    },
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [],
})
