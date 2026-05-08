import Link from 'next/link'
import { FileWarningIcon, LanguagesIcon, SparklesIcon, TriangleAlertIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type NoticeCopy = {
  message: string
  title: string
}

type PostArticleNoticesProps = {
  bibliographyMismatch?: {
    intro: string
    keys: string[]
    title: string
  } | null
  fallback?: NoticeCopy | null
  machineTranslation?: NoticeCopy | null
  preview?: {
    body: string
    exitHref: string
    exitLabel: string
    title: string
  } | null
}

function PreviewNotice(props: NonNullable<PostArticleNoticesProps['preview']>) {
  const { body, exitHref, exitLabel, title } = props

  return (
    <Alert className="border-border bg-transparent" data-embedded-hidden="true">
      <SparklesIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="gap-3">
        <p>{body}</p>
        <Button asChild size="sm" variant="outline">
          <Link href={exitHref}>{exitLabel}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function TranslationNotice(props: NoticeCopy & { tone: 'info' | 'warning' }) {
  const { message, title, tone } = props
  const Icon = tone === 'warning' ? TriangleAlertIcon : LanguagesIcon

  return (
    <Alert
      className={
        tone === 'warning' ? 'border-destructive/40 bg-transparent' : 'border-border bg-transparent'
      }
    >
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
      </AlertDescription>
    </Alert>
  )
}

function BibliographyMismatchNotice(
  props: NonNullable<PostArticleNoticesProps['bibliographyMismatch']>,
) {
  const { intro, keys, title } = props

  return (
    <Alert className="border-destructive/40 bg-transparent">
      <FileWarningIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="gap-3">
        <p>{intro}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {keys.map((key) => (
            <span key={key}>{key}</span>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export function PostArticleNotices(props: PostArticleNoticesProps) {
  const { bibliographyMismatch, fallback, machineTranslation, preview } = props

  if (!preview && !fallback && !machineTranslation && !bibliographyMismatch?.keys.length) {
    return null
  }

  return (
    <div className="grid gap-3">
      {preview ? <PreviewNotice {...preview} /> : null}
      {fallback ? <TranslationNotice {...fallback} tone="warning" /> : null}
      {machineTranslation ? <TranslationNotice {...machineTranslation} tone="info" /> : null}
      {bibliographyMismatch?.keys.length ? (
        <BibliographyMismatchNotice {...bibliographyMismatch} />
      ) : null}
    </div>
  )
}
