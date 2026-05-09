import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { PostViewDedupe } from './collections/PostViewDedupe'
import { PostViewMetrics } from './collections/PostViewMetrics'
import { SiteSettings } from './globals/SiteSettings'
import { defaultLocale, payloadLocales } from './lib/locales'
import { ensureRuntimeDirectories } from './lib/runtime-directories'
import { defaultDatabaseURL } from './lib/runtime-paths'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

ensureRuntimeDirectories()

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts, PostViewMetrics, PostViewDedupe],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  localization: {
    defaultLocale,
    fallback: true,
    locales: payloadLocales,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || defaultDatabaseURL,
    },
  }),
  sharp,
  plugins: [],
})
