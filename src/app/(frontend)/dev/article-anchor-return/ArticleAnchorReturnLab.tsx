'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { CornerUpLeftIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'
import { useArticleAnchorReturnNavigation } from '@/features/article/ui/useArticleAnchorReturnNavigation'

import {
  articleAnchorReturnVariants,
  defaultArticleAnchorReturnVariantID,
  getArticleAnchorReturnVariant,
  type ArticleAnchorReturnVariantID,
} from './articleAnchorReturnLabModel'

const fadePillCollapseDelayMs = 3200
const autoToastDismissDelayMs = 4200
const dismissLabel = '隐藏返回提示'

type ArticleAnchorReturnLabContextValue = {
  activeVariantID: ArticleAnchorReturnVariantID
  setActiveVariantID: (id: ArticleAnchorReturnVariantID) => void
}

const ArticleAnchorReturnLabContext = createContext<ArticleAnchorReturnLabContextValue>({
  activeVariantID: defaultArticleAnchorReturnVariantID,
  setActiveVariantID: () => undefined,
})

function useArticleAnchorReturnLab() {
  return useContext(ArticleAnchorReturnLabContext)
}

export function ArticleAnchorReturnLabShell(props: { children: ReactNode }) {
  const [activeVariantID, setActiveVariantID] = useState<ArticleAnchorReturnVariantID>(
    defaultArticleAnchorReturnVariantID,
  )
  const activeVariant = getArticleAnchorReturnVariant(activeVariantID)

  return (
    <ArticleAnchorReturnLabContext.Provider value={{ activeVariantID, setActiveVariantID }}>
      <div data-anchor-return-active-variant={activeVariantID} data-anchor-return-lab-root="">
        {props.children}
        <aside aria-label="锚点返回控件实验控制台" className="article-anchor-return-lab-controls">
          <div className="article-anchor-return-lab-controls__header">
            <span>Anchor return</span>
            <span>{activeVariant.label}</span>
          </div>
          <div
            aria-label="返回控件方案"
            className="article-anchor-return-lab-controls__buttons"
            role="group"
          >
            {articleAnchorReturnVariants.map((variant) => (
              <Button
                aria-pressed={activeVariantID === variant.id}
                key={variant.id}
                onClick={() => {
                  setActiveVariantID(variant.id)
                }}
                size="xs"
                type="button"
                variant={activeVariantID === variant.id ? 'secondary' : 'outline'}
              >
                {variant.label}
              </Button>
            ))}
          </div>
          <p className="article-anchor-return-lab-controls__description">
            {activeVariant.description}
          </p>
        </aside>
      </div>
    </ArticleAnchorReturnLabContext.Provider>
  )
}

export function ArticleAnchorReturnLabNavigation(props: { returnLabel: string }) {
  const { returnLabel } = props
  const { activeVariantID } = useArticleAnchorReturnLab()
  const { buttonRef, dismissReturnState, returnButtonStyle, returnState, returnToReadingPosition } =
    useArticleAnchorReturnNavigation()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(false)

    if (!returnState) {
      return undefined
    }

    if (activeVariantID === 'fade-pill') {
      const timeout = window.setTimeout(() => {
        setCollapsed(true)
      }, fadePillCollapseDelayMs)

      return () => {
        window.clearTimeout(timeout)
      }
    }

    if (activeVariantID === 'auto-toast') {
      const timeout = window.setTimeout(dismissReturnState, autoToastDismissDelayMs)

      return () => {
        window.clearTimeout(timeout)
      }
    }

    return undefined
  }, [activeVariantID, dismissReturnState, returnState])

  if (!returnState) {
    return null
  }

  if (activeVariantID === 'baseline') {
    return (
      <Button
        aria-label={returnLabel}
        className="article-anchor-return"
        data-anchor-return-positioned="true"
        data-anchor-return-variant="baseline"
        onClick={returnToReadingPosition}
        ref={buttonRef}
        size="sm"
        style={returnButtonStyle}
        type="button"
        variant="secondary"
      >
        <CornerUpLeftIcon aria-hidden="true" data-icon="inline-start" />
        <span>{returnLabel}</span>
      </Button>
    )
  }

  const shellStyle: CSSProperties | undefined =
    activeVariantID === 'edge-tab'
      ? { top: returnState.position.top }
      : activeVariantID === 'auto-toast'
        ? undefined
        : returnButtonStyle

  return (
    <div
      className={cn('article-anchor-return-lab', `article-anchor-return-lab--${activeVariantID}`)}
      data-anchor-return-collapsed={activeVariantID === 'fade-pill' ? String(collapsed) : undefined}
      data-anchor-return-positioned="true"
      style={shellStyle}
    >
      <Button
        aria-label={returnLabel}
        className="article-anchor-return-lab__action"
        data-anchor-return-collapsed={
          activeVariantID === 'fade-pill' ? String(collapsed) : undefined
        }
        data-anchor-return-variant={activeVariantID}
        onClick={returnToReadingPosition}
        ref={buttonRef}
        size={collapsed && activeVariantID === 'fade-pill' ? 'icon-sm' : 'sm'}
        type="button"
        variant="secondary"
      >
        <CornerUpLeftIcon aria-hidden="true" data-icon="inline-start" />
        <span className="article-anchor-return-lab__label">{returnLabel}</span>
      </Button>
      <Button
        aria-label={dismissLabel}
        className="article-anchor-return-lab__dismiss"
        onClick={dismissReturnState}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <XIcon aria-hidden="true" />
      </Button>
    </div>
  )
}
