'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useState } from 'react'

export function PostLivePreviewRefresh(props: { serverURL: string }) {
  const { serverURL } = props
  const router = useRouter()
  const [isEmbeddedPreview, setIsEmbeddedPreview] = useState(false)

  useEffect(() => {
    setIsEmbeddedPreview(Boolean(window.opener) || window.parent !== window)
  }, [])

  useEffect(() => {
    if (isEmbeddedPreview) {
      document.documentElement.dataset.zblogEmbeddedPreview = 'true'

      return () => {
        delete document.documentElement.dataset.zblogEmbeddedPreview
      }
    }

    delete document.documentElement.dataset.zblogEmbeddedPreview

    return undefined
  }, [isEmbeddedPreview])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.type !== 'zblog-preview-controls'
      ) {
        return
      }

      const theme = event.data.theme

      if (theme === 'dark' || theme === 'light') {
        document.documentElement.dataset.zblogPreviewTheme = theme
      } else {
        delete document.documentElement.dataset.zblogPreviewTheme
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
      delete document.documentElement.dataset.zblogPreviewTheme
    }
  }, [])

  if (!isEmbeddedPreview) {
    return null
  }

  return (
    <RefreshRouteOnSave
      refresh={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
      serverURL={serverURL}
    />
  )
}
