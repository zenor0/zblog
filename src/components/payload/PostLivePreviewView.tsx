'use client'

import type { DocumentViewClientProps } from 'payload'

import {
  ShimmerEffect,
  useAllFormFields,
  useDocumentEvents,
  useDocumentInfo,
  useLivePreviewContext,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useEffect, useMemo, useRef, useState } from 'react'

import { PostLivePreviewToolbar } from './PostLivePreviewToolbar'
import {
  clampDimension,
  getNumericBreakpointSize,
  getTargetOrigin,
  isPreviewTheme,
  minimumPreviewHeight,
  minimumPreviewWidth,
  previewThemeStorageKey,
  type PreviewTheme,
} from './postLivePreviewModel'
import './post-live-preview-view.scss'

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
    popupRef,
    previewWindowType,
    setMeasuredDeviceSize,
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
        <PostLivePreviewToolbar setTheme={setTheme} theme={theme} />

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
