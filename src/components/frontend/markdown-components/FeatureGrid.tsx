import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type FeatureGridItem = {
  description?: string
  status?: string
  title: string
}

function normalizeFeatureGridItem(value: unknown): FeatureGridItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''

  if (!title) {
    return null
  }

  return {
    description: typeof candidate.description === 'string' ? candidate.description.trim() : undefined,
    status: typeof candidate.status === 'string' ? candidate.status.trim() : undefined,
    title,
  }
}

function parseFeatureGridItems(value: unknown): FeatureGridItem[] {
  const source =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value) as unknown
          } catch {
            return []
          }
        })()
      : value

  if (!Array.isArray(source)) {
    return []
  }

  return source.map(normalizeFeatureGridItem).filter((item): item is FeatureGridItem => item !== null)
}

export function FeatureGrid(props: { items?: unknown }) {
  const items = parseFeatureGridItems(props.items)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2" data-markdown-component="feature-grid">
      {items.map((item) => (
        <Card className="gap-0 border-border/80 shadow-none" key={`${item.title}-${item.status ?? 'item'}`}>
          <CardHeader className="gap-3 pb-4">
            {item.status ? (
              <Badge className="uppercase tracking-[0.16em]" variant="secondary">
                {item.status}
              </Badge>
            ) : null}
            <CardTitle className="text-base">{item.title}</CardTitle>
          </CardHeader>
          {item.description ? (
            <CardContent className="pt-0 text-sm leading-7 text-muted-foreground">
              {item.description}
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  )
}
