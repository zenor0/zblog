import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type NoticeTone = 'default' | 'info' | 'success' | 'warning'

const toneClasses: Record<NoticeTone, string> = {
  default: 'border-border bg-card/80',
  info: 'border-sky-200 bg-sky-50/80',
  success: 'border-emerald-200 bg-emerald-50/80',
  warning: 'border-amber-200 bg-amber-50/80',
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
      className={cn('my-6 gap-0 overflow-hidden shadow-none', toneClasses[tone])}
      data-markdown-component="notice-card"
      data-tone={tone}
    >
      <CardHeader className="gap-3 border-b border-black/5 pb-5">
        <Badge variant="outline">{tone}</Badge>
        {props.title ? <CardTitle className="text-lg">{props.title}</CardTitle> : null}
      </CardHeader>
      <CardContent className="pt-5">{props.children}</CardContent>
    </Card>
  )
}
