import { CollapsibleReferenceSection } from '@/features/article/ui/CollapsibleReferenceSection'
import { ArticleLinkPreviewLink } from '@/features/article/ui/ArticleLinkPreviewLink'
import { MediaDetails } from '@/features/media/ui/MediaDetails'
import { MediaSurface } from '@/features/media/ui/MediaSurface'
import { createFallbackLinkPreview } from '@/features/article/model/article-link-previews'
import { describeBibliographyEntry, type BibliographyEntry } from '@/features/article/model/bibliography'
import type { AppLocale } from '@/shared/i18n/locales'
import { getLocaleLabel } from '@/shared/i18n/locales'
import { resolveAttachmentDescription, resolveMediaAsset } from '@/features/media/model/media'
import type { Post } from '@/payload-types'

type AttachmentItem = NonNullable<Post['attachments']>[number]
type PopulatedAttachment = AttachmentItem & {
  file: Exclude<AttachmentItem['file'], number> & {
    url: string
  }
}

type PostArticleSupplementaryProps = {
  attachments: Post['attachments']
  bibliographyEntries: BibliographyEntry[]
  labels: {
    attachments: string
    mediaCredit: string
    referenceItem: string
    referenceNoDate: string
    referenceRoleEditor: string
    referenceRoleTranslator: string
    references: string
    referenceUntitled: string
    tags: string
  }
  referenceAccessedLabel: (date: string) => string
  referencesCountLabel: string
  resolvedLocale: AppLocale
  tags: Post['tags']
}

function isPopulatedAttachment(item: AttachmentItem): item is PopulatedAttachment {
  return Boolean(item.file && typeof item.file === 'object' && item.file.url)
}

function ArticleTags(props: { label: string; tags: NonNullable<Post['tags']> }) {
  const { label, tags } = props

  return (
    <section className="flex flex-col gap-3">
      <p className="section-kicker">{label}</p>
      <div className="editorial-tag-list">
        {tags.map((tag) => (
          <span key={tag.id ?? tag.value}>{tag.value}</span>
        ))}
      </div>
    </section>
  )
}

function ArticleAttachments(props: {
  attachments: PopulatedAttachment[]
  labels: Pick<PostArticleSupplementaryProps['labels'], 'attachments' | 'mediaCredit'>
}) {
  const { attachments, labels } = props

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="section-kicker">{labels.attachments}</p>
        <h2 className="font-serif text-xl text-foreground">{labels.attachments}</h2>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {attachments.map((attachment) => {
          const file = attachment.file
          const asset = resolveMediaAsset({
            alt: attachment.label || file.alt || file.filename,
            media: file,
          })
          const attachmentDescription = resolveAttachmentDescription({
            caption: file.caption,
            description: attachment.description,
          })
          const typeLabel = asset?.kind === 'pdf' ? 'PDF' : asset?.extensionLabel || 'FILE'

          return (
            <ArticleLinkPreviewLink
              className="group grid gap-4 py-4 transition-colors hover:text-foreground sm:grid-cols-[7rem_minmax(0,1fr)]"
              href={file.url}
              key={attachment.id ?? file.id}
              preview={createFallbackLinkPreview(
                file.url,
                attachment.label || file.filename || file.alt,
              )}
              rel="noreferrer"
              target="_blank"
            >
              <div className="sm:w-28 sm:flex-none">
                <MediaSurface
                  alt={attachment.label || file.alt || file.filename}
                  asset={asset}
                  variant="attachment"
                />
              </div>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="editorial-tag-list gap-y-1">
                  <span>{typeLabel}</span>
                  {file.filename ? <span className="truncate">{file.filename}</span> : null}
                </span>
                <span className="font-serif text-lg text-foreground">
                  {attachment.label || file.filename || file.alt}
                </span>
                <MediaDetails
                  caption={attachmentDescription}
                  credit={file.credit}
                  creditPrefix={labels.mediaCredit}
                />
              </span>
            </ArticleLinkPreviewLink>
          )
        })}
      </div>
    </section>
  )
}

function ArticleReferences(props: {
  entries: BibliographyEntry[]
  labels: Pick<
    PostArticleSupplementaryProps['labels'],
    | 'referenceItem'
    | 'referenceNoDate'
    | 'referenceRoleEditor'
    | 'referenceRoleTranslator'
    | 'references'
    | 'referenceUntitled'
  >
  referenceAccessedLabel: (date: string) => string
  referencesCountLabel: string
  resolvedLocale: AppLocale
}) {
  const { entries, labels, referenceAccessedLabel, referencesCountLabel, resolvedLocale } = props

  return (
    <section className="flex flex-col gap-3">
      <p className="section-kicker">{labels.references}</p>
      <CollapsibleReferenceSection countLabel={referencesCountLabel} label={labels.references}>
        <ol className="flex flex-col">
          {entries.map((entry, index) => {
            const display = describeBibliographyEntry(entry)
            const displayYear = display.year || labels.referenceNoDate
            const roleLabel =
              display.creatorRole === 'editor'
                ? labels.referenceRoleEditor
                : display.creatorRole === 'translator'
                  ? labels.referenceRoleTranslator
                  : null
            const typeLabel =
              entry.entryType.trim().length > 0
                ? entry.entryType.replace(/-/g, ' ')
                : labels.referenceItem

            return (
              <li
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b py-2.5 last:border-b-0"
                id={`reference-${index + 1}`}
                key={entry.citationKey}
              >
                <span className="pt-0.5 text-[11px] font-medium text-muted-foreground">
                  [{index + 1}]
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="min-w-0 text-sm leading-6 text-foreground/82 wrap-anywhere">
                    {display.creators ? <>{display.creators}</> : null}
                    {roleLabel && display.creators ? <> ({roleLabel})</> : null}
                    <> {`(${displayYear}).`}</>
                    {display.title ? <> {display.title}.</> : <> {labels.referenceUntitled}.</>}
                  </p>

                  {display.container || display.secondary.length || display.accessed ? (
                    <div className="flex min-w-0 flex-col gap-0.5 text-[13px] leading-5 text-muted-foreground">
                      {[display.container, ...display.secondary]
                        .filter((segment): segment is string => Boolean(segment))
                        .map((segment, segmentIndex) => (
                          <p className="wrap-anywhere" key={`${entry.citationKey}-${segmentIndex}`}>
                            {segment}
                          </p>
                        ))}
                      {display.accessed ? (
                        <p className="wrap-anywhere">{referenceAccessedLabel(display.accessed)}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {display.links.length ? (
                    <p className="min-w-0 text-[13px] leading-5 text-muted-foreground">
                      {display.links.map((link, linkIndex) => (
                        <span key={`${entry.citationKey}-${link.label}`}>
                          {linkIndex > 0 ? <span className="px-1.5 text-border">·</span> : null}
                          <ArticleLinkPreviewLink
                            className="editorial-link wrap-anywhere no-underline"
                            href={link.href}
                            preview={createFallbackLinkPreview(
                              link.href,
                              `${link.label}: ${link.value}`,
                            )}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <span className="text-muted-foreground">{link.label}:</span>{' '}
                            {link.value}
                          </ArticleLinkPreviewLink>
                        </span>
                      ))}
                    </p>
                  ) : null}

                  <span className="min-w-0 text-[11px] leading-4 text-muted-foreground/85 wrap-anywhere">
                    {entry.citationKey} · {typeLabel}
                    {roleLabel ? ` · ${roleLabel}` : ''} · {getLocaleLabel(resolvedLocale)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </CollapsibleReferenceSection>
    </section>
  )
}

export function PostArticleSupplementary(props: PostArticleSupplementaryProps) {
  const {
    attachments: rawAttachments,
    bibliographyEntries,
    labels,
    referenceAccessedLabel,
    referencesCountLabel,
    resolvedLocale,
    tags,
  } = props
  const attachments = (rawAttachments ?? []).filter(isPopulatedAttachment)

  if (!tags?.length && !attachments.length && !bibliographyEntries.length) {
    return null
  }

  return (
    <div
      className="flex flex-col gap-10 border-t border-border pt-10"
      data-article-supplementary=""
    >
      {tags?.length ? <ArticleTags label={labels.tags} tags={tags} /> : null}

      {attachments.length ? (
        <ArticleAttachments
          attachments={attachments}
          labels={{
            attachments: labels.attachments,
            mediaCredit: labels.mediaCredit,
          }}
        />
      ) : null}

      {bibliographyEntries.length ? (
        <ArticleReferences
          entries={bibliographyEntries}
          labels={{
            referenceItem: labels.referenceItem,
            referenceNoDate: labels.referenceNoDate,
            referenceRoleEditor: labels.referenceRoleEditor,
            referenceRoleTranslator: labels.referenceRoleTranslator,
            references: labels.references,
            referenceUntitled: labels.referenceUntitled,
          }}
          referenceAccessedLabel={referenceAccessedLabel}
          referencesCountLabel={referencesCountLabel}
          resolvedLocale={resolvedLocale}
        />
      ) : null}
    </div>
  )
}
