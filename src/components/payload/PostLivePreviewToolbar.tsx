'use client'

import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ChevronIcon,
  ExternalLinkIcon,
  Popup,
  PopupList,
  XIcon,
  useLivePreviewContext,
  useTranslation,
} from '@payloadcms/ui'

import {
  clampDimension,
  minimumPreviewHeight,
  minimumPreviewWidth,
  type PreviewTheme,
  zoomOptions,
} from './postLivePreviewModel'

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
  }, [
    axis,
    breakpoint,
    measuredDeviceSize.height,
    measuredDeviceSize.width,
    size.height,
    size.width,
  ])

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

export function PostLivePreviewToolbar(props: {
  setTheme: Dispatch<SetStateAction<PreviewTheme>>
  theme: PreviewTheme
}) {
  const { setTheme, theme } = props
  const { t } = useTranslation()
  const { breakpoint, breakpoints, setBreakpoint, setPreviewWindowType, setZoom, url, zoom } =
    useLivePreviewContext()

  const currentBreakpointLabel = useMemo(
    () => breakpoints?.find((item) => item.name === breakpoint)?.label ?? t('general:custom'),
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

  return (
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
  )
}
