'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

import {
  articleLayoutPresets,
  articleLayoutPresetTokenNames,
  defaultArticleLayoutPresetID,
  type ArticleLayoutPresetID,
} from './articleLayoutPresets'

export function ArticleLayoutLabControls() {
  const [activePresetID, setActivePresetID] = useState<ArticleLayoutPresetID>(
    defaultArticleLayoutPresetID,
  )
  const activePreset =
    articleLayoutPresets.find((preset) => preset.id === activePresetID) ?? articleLayoutPresets[0]

  useEffect(() => {
    document.documentElement.dataset.articleLayoutPreset = activePresetID
    const activeTokens =
      articleLayoutPresets.find((preset) => preset.id === activePresetID)?.tokens ?? {}

    for (const tokenName of articleLayoutPresetTokenNames) {
      const tokenValue = activeTokens[tokenName]

      if (tokenValue) {
        document.documentElement.style.setProperty(tokenName, tokenValue)
      } else {
        document.documentElement.style.removeProperty(tokenName)
      }
    }

    return () => {
      delete document.documentElement.dataset.articleLayoutPreset

      for (const tokenName of articleLayoutPresetTokenNames) {
        document.documentElement.style.removeProperty(tokenName)
      }
    }
  }, [activePresetID])

  return (
    <aside
      aria-label="文章排版方案"
      className="article-layout-lab-controls"
      data-article-layout-controls=""
    >
      <div className="article-layout-lab-controls__header">
        <span>Layout lab</span>
        <span>{activePreset?.label}</span>
      </div>
      <div className="article-layout-lab-controls__buttons" role="group" aria-label="排版方案">
        {articleLayoutPresets.map((preset) => (
          <Button
            aria-pressed={activePresetID === preset.id}
            key={preset.id}
            onClick={() => {
              setActivePresetID(preset.id)
            }}
            size="xs"
            type="button"
            variant={activePresetID === preset.id ? 'secondary' : 'outline'}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {activePreset ? (
        <p className="article-layout-lab-controls__description">{activePreset.description}</p>
      ) : null}
    </aside>
  )
}
