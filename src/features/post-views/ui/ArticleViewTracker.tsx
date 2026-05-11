'use client'

import { useEffect } from 'react'

import type { AppLocale } from '@/shared/i18n/locales'

export function ArticleViewTracker(props: { locale: AppLocale; postId: number | string }) {
  const { locale, postId } = props

  useEffect(() => {
    const normalizedPostID = typeof postId === 'number' ? postId : Number(postId)

    if (!Number.isInteger(normalizedPostID) || normalizedPostID <= 0) {
      return
    }

    void fetch('/api/post-views', {
      body: JSON.stringify({
        locale,
        postId: normalizedPostID,
      }),
      headers: {
        'content-type': 'application/json',
      },
      keepalive: true,
      method: 'POST',
    }).catch(() => {
      // View tracking must never interrupt reading.
    })
  }, [locale, postId])

  return null
}
