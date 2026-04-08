import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { defaultLocale, normalizeLocale, supportedLocales } from '@/lib/locales'
import { buildTranslationLocaleRow } from '@/components/payload/postTranslationSummary'
import { TranslatePostLocaleAction } from '@/components/payload/TranslatePostLocaleAction'

import './post-translation-manager.scss'

function getAccessOverride(reqUser: unknown) {
  return reqUser ? ({ overrideAccess: false as const } as const) : {}
}

function buildLocalRequest(args: {
  locale?: string
  req: UIFieldServerProps['req']
}): Partial<UIFieldServerProps['req']> {
  const localReq: Partial<UIFieldServerProps['req']> = {}

  if (args.locale) {
    localReq.locale = args.locale
  }

  if (args.req.user) {
    localReq.user = args.req.user
  }

  return localReq
}

export const PostTranslationManager: UIFieldServerComponent = async ({ id, req }) => {
  if (typeof id !== 'number' && typeof id !== 'string') {
    return (
      <section className="post-translation-manager">
        <div className="post-translation-manager__empty">
          <h3>Translation management</h3>
          <p>Save this post first to manage locale versions and translation actions.</p>
        </div>
      </section>
    )
  }

  const activeLocale =
    normalizeLocale(typeof req.locale === 'string' ? req.locale : undefined) ?? defaultLocale
  const adminRoute = req.payload.config.routes.admin

  const rows = await Promise.all(
    supportedLocales.map(async (locale) => {
      const snapshot = await req.payload.findByID({
        collection: 'posts',
        depth: 0,
        draft: true,
        fallbackLocale: false,
        id,
        locale: locale.code,
        req: buildLocalRequest({
          locale: locale.code,
          req,
        }),
        select: {
          content: true,
          excerpt: true,
          title: true,
          translatedAt: true,
          translatedFromLocale: true,
          translationStatus: true,
        },
        user: req.user,
        ...getAccessOverride(req.user),
      })

      return buildTranslationLocaleRow({
        activeLocale,
        locale: locale.code,
        snapshot,
      })
    }),
  )

  return (
    <section className="post-translation-manager">
      <header className="post-translation-manager__header">
        <div>
          <h3>Translation management</h3>
          <p>Review every locale version and trigger translations without switching the admin locale.</p>
        </div>
      </header>

      <ul className="post-translation-manager__rows">
        {rows.map((row) => (
          <li className="post-translation-manager__row" key={row.code}>
            <div className="post-translation-manager__copy">
              <strong>{row.label}</strong>
              <span>{row.completionLabel}</span>
              <span>{row.translationStatusLabel}</span>
              {row.translationNote ? <span>{row.translationNote}</span> : null}
            </div>

            <div className="post-translation-manager__actions">
              {row.isDefault ? <span className="post-translation-manager__badge">Default</span> : null}
              {row.isActive ? <span className="post-translation-manager__badge">Active</span> : null}
              <a href={`${adminRoute}/collections/posts/${id}?locale=${row.code}`}>Edit locale</a>
              <TranslatePostLocaleAction
                collectionSlug="posts"
                id={id}
                sourceOptions={rows.map((item) => ({
                  code: item.code,
                  label: item.label,
                }))}
                targetLabel={row.label}
                targetLocale={row.code}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PostTranslationManager
