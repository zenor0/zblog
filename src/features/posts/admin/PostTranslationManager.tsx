import type { UIFieldServerComponent, UIFieldServerProps } from 'payload'

import { Button, Pill } from '@payloadcms/ui'
import { defaultLocale, normalizeLocale, supportedLocales, type AppLocale } from '@/shared/i18n/locales'
import { buildTranslationLocaleRow } from '@/features/posts/admin/postTranslationSummary'
import { TranslatePostLocaleAction } from '@/features/posts/admin/TranslatePostLocaleAction'

import './post-translation-manager.scss'

function getAccessOverride(reqUser: unknown) {
  return reqUser ? ({ overrideAccess: false as const } as const) : {}
}

function buildLocalRequest(args: {
  locale?: AppLocale
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

function getCompletionPillStyle(completedFields: number) {
  if (completedFields >= 3) {
    return 'success' as const
  }

  if (completedFields > 0) {
    return 'warning' as const
  }

  return 'light' as const
}

function getTranslationStatusPillStyle(status: string | null | undefined) {
  switch (status) {
    case 'reviewed':
      return 'success' as const
    case 'machine':
      return 'warning' as const
    case 'original':
      return 'dark' as const
    default:
      return 'light' as const
  }
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
          <p>
            Review every locale version and trigger translations without switching the admin
            locale.
          </p>
        </div>
      </header>

      <ul className="post-translation-manager__rows">
        {rows.map((row) => (
          <li className="post-translation-manager__row" key={row.code}>
            <div className="post-translation-manager__row-main">
              <div className="post-translation-manager__copy">
                <div className="post-translation-manager__heading">
                  <strong>{row.label}</strong>
                  <span>{row.code}</span>
                </div>

                <div className="post-translation-manager__pills">
                  <Pill
                    pillStyle={getCompletionPillStyle(row.completedFields)}
                    size="small"
                  >
                    {row.completionLabel} translated
                  </Pill>
                  <Pill
                    pillStyle={getTranslationStatusPillStyle(row.snapshot?.translationStatus)}
                    size="small"
                  >
                    {row.translationStatusLabel}
                  </Pill>
                  {row.isDefault ? (
                    <Pill pillStyle="light-gray" size="small">
                      Default
                    </Pill>
                  ) : null}
                  {row.isActive ? (
                    <Pill pillStyle="light-gray" size="small">
                      Active
                    </Pill>
                  ) : null}
                </div>

                {row.translationNote ? (
                  <p className="post-translation-manager__note">{row.translationNote}</p>
                ) : (
                  <p className="post-translation-manager__note">
                    {row.completedFields === 0
                      ? 'No translated fields yet.'
                      : 'Locale content is available and ready for review.'}
                  </p>
                )}
              </div>

              <div className="post-translation-manager__actions">
                <Button
                  buttonStyle="secondary"
                  el="link"
                  margin={false}
                  size="small"
                  to={`${adminRoute}/collections/posts/${id}?locale=${row.code}`}
                >
                  Edit locale
                </Button>
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
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PostTranslationManager
