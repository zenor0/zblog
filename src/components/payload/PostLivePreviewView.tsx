'use client'

import type { DocumentViewClientProps } from 'payload'

import {
  ChevronIcon,
  ExternalLinkIcon,
  Popup,
  PopupList,
  ShimmerEffect,
  XIcon,
  useAllFormFields,
  useDocumentEvents,
  useDocumentInfo,
  useLivePreviewContext,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import './post-live-preview-view.scss'

type PreviewTheme = 'auto' | 'dark' | 'light'

const previewThemeStorageKey = 'zblog-admin-live-preview-theme'
const minimumPreviewHeight = 320
const minimumPreviewWidth = 320
const zoomOptions = [50, 75, 100, 125, 150, 200]

function clampDimension(value: number, minimum: number) {
  return Math.max(minimum, Math.round(value))
}

function getTargetOrigin(url: null | string | undefined) {
  if (typeof url !== 'string' || url.length === 0 || typeof window === 'undefined') {
    return null
  }

  try {
    return new URL(url, window.location.origin).origin
  } catch {
    return null
  }
}

function isPreviewTheme(value: unknown): value is PreviewTheme {
  return value === 'auto' || value === 'dark' || value === 'light'
}

function getNumericBreakpointSize(args: {
  breakpoint: string | undefined
  breakpoints:
    | {
        height: number | string
        label: string
        name: string
        width: number | string
      }[]
    | undefined
}) {
  const activeBreakpoint = args.breakpoints?.find((item) => item.name === args.breakpoint)

  return {
    height: typeof activeBreakpoint?.height === 'number' ? activeBreakpoint.height : null,
    width: typeof activeBreakpoint?.width === 'number' ? activeBreakpoint.width : null,
  }
}

function PreviewSizeInput(props: { axis: 'x' | 'y' }) {
  const { axis } = props
  const { breakpoint, measuredDeviceSize, setBreakpoint, setSize, size } = useLivePreviewContext()
  const [internalValue, setInternalValue] = useState(0)

  useEffect(() => {
    if (breakpoint === 'responsive') {
      const nextValue = axis === 'x' ? measuredDeviceSize.width : measuredDeviceSize.height

      setInternalValue(Math.round(nextValue))

      return
    }

    setInternalValue(Math.round(axis === 'x' ? size.width : size.height))
  }, [axis, breakpoint, measuredDeviceSize.height, measuredDeviceSize.width, size.height, size.width])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = Number(event.target.value)
      const nextValue = clampDimension(
        Number.isFinite(rawValue) ? rawValue : 0,
        axis === 'x' ? minimumPreviewWidth : minimumPreviewHeight,
      )
      const fallbackHeight =
        breakpoint === 'responsive'
          ? Math.max(minimumPreviewHeight, Math.round(measuredDeviceSize.height))
          : clampDimension(size.height, minimumPreviewHeight)
      const fallbackWidth =
        breakpoint === 'responsive'
          ? Math.max(minimumPreviewWidth, Math.round(measuredDeviceSize.width))
          : clampDimension(size.width, minimumPreviewWidth)

      setInternalValue(nextValue)
      setBreakpoint('custom')
      setSize({
        type: 'reset',
        value: {
          height: axis === 'y' ? nextValue : fallbackHeight,
          width: axis === 'x' ? nextValue : fallbackWidth,
        },
      })
    },
    [
      axis,
      breakpoint,
      measuredDeviceSize.height,
      measuredDeviceSize.width,
      setBreakpoint,
      setSize,
      size.height,
      size.width,
    ],
  )

  return (
    <input
      className="toolbar-input"
      min={axis === 'x' ? minimumPreviewWidth : minimumPreviewHeight}
      name={axis === 'x' ? 'live-preview-width' : 'live-preview-height'}
      onChange={handleChange}
      step={1}
      type="number"
      value={internalValue || 0}
    />
  )
}

export function PostLivePreviewView(_props: DocumentViewClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [formState] = useAllFormFields()
  const { collectionSlug, globalSlug, id } = useDocumentInfo()
  const { mostRecentUpdate } = useDocumentEvents()
  const {
    appIsReady,
    breakpoint,
    breakpoints,
    iframeRef,
    isLivePreviewing,
    measuredDeviceSize,
    popupRef,
    previewWindowType,
    setBreakpoint,
    setMeasuredDeviceSize,
    setPreviewWindowType,
    setSize,
    setZoom,
    size,
    url,
    zoom,
  } = useLivePreviewContext()
  const previewFrameRef = useRef<HTMLDivElement | null>(null)
  const [theme, setTheme] = useState<PreviewTheme>('auto')
  const hasBreakpoint = Boolean(breakpoint && breakpoint !== 'responsive')
  const previewTargetOrigin = getTargetOrigin(url)
  const activeBreakpointSize = useMemo(
    () =>
      getNumericBreakpointSize({
        breakpoint,
        breakpoints,
      }),
    [breakpoint, breakpoints],
  )

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(previewThemeStorageKey)

    if (isPreviewTheme(storedTheme)) {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(previewThemeStorageKey, theme)
  }, [theme])

  useEffect(() => {
    const previewFrameNode = previewFrameRef.current

    if (!previewFrameNode || typeof ResizeObserver === 'undefined') {
      return
    }

    const syncSize = () => {
      setMeasuredDeviceSize({
        height: previewFrameNode.clientHeight,
        width: previewFrameNode.clientWidth,
      })
    }

    syncSize()

    const observer = new ResizeObserver(() => {
      syncSize()
    })

    observer.observe(previewFrameNode)

    return () => {
      observer.disconnect()
    }
  }, [setMeasuredDeviceSize])

  useEffect(() => {
    if (!isLivePreviewing || !appIsReady || !previewTargetOrigin) {
      return
    }

    if (!formState) {
      return
    }

    const values = reduceFieldsToValues(formState, true)

    if (!values.id) {
      values.id = id
    }

    const message = {
      collectionSlug,
      data: values,
      externallyUpdatedRelationship: mostRecentUpdate,
      globalSlug,
      locale: locale.code,
      type: 'payload-live-preview',
    }

    if (previewWindowType === 'popup' && popupRef?.current) {
      popupRef.current.postMessage(message, previewTargetOrigin)
    }

    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, previewTargetOrigin)
    }
  }, [
    appIsReady,
    collectionSlug,
    formState,
    globalSlug,
    id,
    iframeRef,
    isLivePreviewing,
    locale.code,
    mostRecentUpdate,
    popupRef,
    previewTargetOrigin,
    previewWindowType,
  ])

  useEffect(() => {
    if (!isLivePreviewing || !appIsReady || !previewTargetOrigin) {
      return
    }

    const message = {
      type: 'payload-document-event',
    }

    if (previewWindowType === 'popup' && popupRef?.current) {
      popupRef.current.postMessage(message, previewTargetOrigin)
    }

    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, previewTargetOrigin)
    }
  }, [appIsReady, iframeRef, isLivePreviewing, popupRef, previewTargetOrigin, previewWindowType])

  useEffect(() => {
    if (!previewTargetOrigin || !url) {
      return
    }

    const message = {
      theme,
      type: 'zblog-preview-controls',
    }

    if (previewWindowType === 'popup' && popupRef?.current) {
      popupRef.current.postMessage(message, previewTargetOrigin)
    }

    if (previewWindowType === 'iframe' && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(message, previewTargetOrigin)
    }
  }, [iframeRef, popupRef, previewTargetOrigin, previewWindowType, theme, url])

  const currentBreakpointLabel = useMemo(
    () =>
      breakpoints?.find((item) => item.name === breakpoint)?.label ??
      t('general:custom'),
    [breakpoint, breakpoints, t],
  )

  const themeLabel = useMemo(() => {
    if (theme === 'light') {
      return t('general:light')
    }

    if (theme === 'dark') {
      return t('general:dark')
    }

    return t('general:automatic')
  }, [t, theme])

  const wrapperClassName = [
    'live-preview-window',
    'post-live-preview-view',
    isLivePreviewing && 'live-preview-window--is-live-previewing',
    hasBreakpoint && 'live-preview-window--has-breakpoint',
  ]
    .filter(Boolean)
    .join(' ')

  const customViewportWidth = clampDimension(
    size.width || activeBreakpointSize.width || 0,
    minimumPreviewWidth,
  )
  const customViewportHeight = clampDimension(
    size.height || activeBreakpointSize.height || 0,
    minimumPreviewHeight,
  )

  const previewFrameStyle = hasBreakpoint
    ? {
        height: `${customViewportHeight}px`,
        width: `${customViewportWidth}px`,
      }
    : undefined

  const previewSurfaceStyle = hasBreakpoint
    ? {
        height: `${customViewportHeight / zoom}px`,
        width: `${customViewportWidth / zoom}px`,
      }
    : {
        height: `${100 / zoom}%`,
        width: `${100 / zoom}%`,
      }

  const previewIframeStyle = {
    transform: `scale(${zoom})`,
  }

  return (
    <div className={wrapperClassName}>
      <div className="live-preview-window__wrapper">
        <div className="live-preview-toolbar live-preview-toolbar--static">
          <div className="live-preview-toolbar-controls post-live-preview-view__toolbar-controls">
            {breakpoints?.length ? (
              <Popup
                button={
                  <>
                    <span>{currentBreakpointLabel}</span>
                    <ChevronIcon className="live-preview-toolbar-controls__chevron" />
                  </>
                }
                className="live-preview-toolbar-controls__breakpoint"
                horizontalAlign="right"
                render={({ close }) => (
                  <PopupList.ButtonGroup>
                    <>
                      {breakpoints.map((item) => (
                        <PopupList.Button
                          active={item.name === breakpoint}
                          key={item.name}
                          onClick={() => {
                            setBreakpoint(item.name)
                            close()
                          }}
                        >
                          {item.label}
                        </PopupList.Button>
                      ))}
                      {breakpoint === 'custom' ? (
                        <PopupList.Button active onClick={close}>
                          {t('general:custom')}
                        </PopupList.Button>
                      ) : null}
                    </>
                  </PopupList.ButtonGroup>
                )}
                showScrollbar
                verticalAlign="bottom"
              />
            ) : null}

            <div className="live-preview-toolbar-controls__device-size">
              <PreviewSizeInput axis="x" />
              <span className="live-preview-toolbar-controls__size-divider">
                <XIcon />
              </span>
              <PreviewSizeInput axis="y" />
            </div>

            <Popup
              button={
                <>
                  <span>{themeLabel}</span>
                  <ChevronIcon className="live-preview-toolbar-controls__chevron" />
                </>
              }
              className="live-preview-toolbar-controls__theme"
              horizontalAlign="right"
              render={({ close }) => (
                <PopupList.ButtonGroup>
                  <>
                    <PopupList.Button
                      active={theme === 'auto'}
                      onClick={() => {
                        setTheme('auto')
                        close()
                      }}
                    >
                      {t('general:automatic')}
                    </PopupList.Button>
                    <PopupList.Button
                      active={theme === 'light'}
                      onClick={() => {
                        setTheme('light')
                        close()
                      }}
                    >
                      {t('general:light')}
                    </PopupList.Button>
                    <PopupList.Button
                      active={theme === 'dark'}
                      onClick={() => {
                        setTheme('dark')
                        close()
                      }}
                    >
                      {t('general:dark')}
                    </PopupList.Button>
                  </>
                </PopupList.ButtonGroup>
              )}
              showScrollbar
              verticalAlign="bottom"
            />

            <Popup
              button={
                <>
                  <span>{Math.round(zoom * 100)}%</span>
                  <ChevronIcon className="live-preview-toolbar-controls__chevron" />
                </>
              }
              className="live-preview-toolbar-controls__zoom"
              horizontalAlign="right"
              render={({ close }) => (
                <PopupList.ButtonGroup>
                  <>
                    {zoomOptions.map((value) => (
                      <PopupList.Button
                        active={Math.round(zoom * 100) === value}
                        key={value}
                        onClick={() => {
                          setZoom(value / 100)
                          close()
                        }}
                      >
                        {value}%
                      </PopupList.Button>
                    ))}
                  </>
                </PopupList.ButtonGroup>
              )}
              showScrollbar
              verticalAlign="bottom"
            />

            <a
              className="live-preview-toolbar-controls__external"
              href={url || undefined}
              onClick={(event) => {
                event.preventDefault()
                setPreviewWindowType('popup')
              }}
              target="_blank"
              title={t('general:open')}
            >
              <ExternalLinkIcon />
            </a>
          </div>
        </div>

        <div className="live-preview-window__main post-live-preview-view__main">
          {previewWindowType === 'popup' ? (
            <div className="post-live-preview-view__detached-state">
              <p>{t('general:livePreview')}</p>
              <span>{t('general:open')}</span>
            </div>
          ) : (
            <div className="post-live-preview-view__canvas">
              <div
                className="post-live-preview-view__frame"
                ref={previewFrameRef}
                style={previewFrameStyle}
              >
                {url ? (
                  <div className="post-live-preview-view__surface" style={previewSurfaceStyle}>
                    <iframe
                      className="live-preview-iframe"
                      ref={iframeRef}
                      src={url}
                      style={previewIframeStyle}
                      title={url}
                    />
                  </div>
                ) : (
                  <ShimmerEffect height="100%" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
