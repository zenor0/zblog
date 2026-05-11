import type { JSX } from 'react'

import { FeatureGrid } from '@/features/article/ui/markdown-components/FeatureGrid'
import { NoticeCard } from '@/features/article/ui/markdown-components/NoticeCard'
export { articleBlockRegistry } from '@/features/article/model/article-design'

export type MarkdownComponentDirectiveName = 'feature-grid' | 'notice-card'
export type MarkdownComponentJsxTag = 'FeatureGrid' | 'NoticeCard'

export type MarkdownComponentDefinition = {
  directiveName: MarkdownComponentDirectiveName
  jsxTag: MarkdownComponentJsxTag
}

export const markdownComponentDefinitions: MarkdownComponentDefinition[] = [
  {
    directiveName: 'feature-grid',
    jsxTag: 'FeatureGrid',
  },
  {
    directiveName: 'notice-card',
    jsxTag: 'NoticeCard',
  },
]

const markdownComponentDefinitionsByDirectiveName = new Map<string, MarkdownComponentDefinition>(
  markdownComponentDefinitions.map((definition) => [definition.directiveName, definition] as const),
)

const markdownComponentDefinitionsByJsxTag = new Map<string, MarkdownComponentDefinition>(
  markdownComponentDefinitions.map((definition) => [definition.jsxTag, definition] as const),
)

export function findMarkdownComponentByDirectiveName(value: string) {
  return markdownComponentDefinitionsByDirectiveName.get(value) ?? null
}

export function findMarkdownComponentByJsxTag(value: string) {
  return markdownComponentDefinitionsByJsxTag.get(value) ?? null
}

export type MarkdownComponentRenderers = Record<
  MarkdownComponentDirectiveName,
  (props: any) => JSX.Element | null
>

export const markdownComponentRenderers: MarkdownComponentRenderers = {
  'feature-grid': ({ items }: any) => <FeatureGrid items={items} />,
  'notice-card': ({ children, title, tone }: any) => (
    <NoticeCard title={title} tone={tone}>
      {children}
    </NoticeCard>
  ),
}
