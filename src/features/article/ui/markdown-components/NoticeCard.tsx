import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/shared/utils/cn'

type NoticeTone = 'default' | 'info' | 'success' | 'warning'

const toneClasses: Record<NoticeTone, string> = {
  default: 'article-semantic-surface--default',
  info: 'article-semantic-surface--info',
  success: 'article-semantic-surface--success',
  warning: 'article-semantic-surface--warning',
}

function resolveTone(value: unknown): NoticeTone {
  return value === 'info' || value === 'success' || value === 'warning' ? value : 'default'
}

export function NoticeCard(props: {
  children?: ReactNode
  title?: null | string
  tone?: null | string
}) {
  const tone = resolveTone(props.tone)

  return (
    <Card
      className={cn(
        'article-notice-card article-semantic-surface my-6 gap-0 overflow-hidden shadow-none',
        toneClasses[tone],
      )}
      data-article-block="notice-card"
      data-markdown-component="notice-card"
      data-tone={tone}
    >
      <CardHeader className="gap-3 border-b pb-5">
        <Badge variant="outline">{tone}</Badge>
        {props.title ? <CardTitle className="text-lg">{props.title}</CardTitle> : null}
      </CardHeader>
      <CardContent className="pt-5">{props.children}</CardContent>
    </Card>
  )
}
