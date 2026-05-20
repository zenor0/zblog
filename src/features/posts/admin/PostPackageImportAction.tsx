'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useRef, useState } from 'react'

import { PostPackageImportPanel } from './PostPackageImportPanel'

export function PostPackageImportAction() {
  const { collectionSlug } = useDocumentInfo()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (collectionSlug !== 'posts') {
    return null
  }

  return (
    <div className="post-package-import" ref={rootRef}>
      <button
        aria-controls="post-package-import-panel"
        aria-expanded={isOpen}
        className="post-package-import__trigger"
        data-testid="post-import-trigger"
        disabled={!isHydrated}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Import
      </button>

      {isOpen ? (
        <div className="post-package-import__panel" id="post-package-import-panel">
          <PostPackageImportPanel onComplete={() => setIsOpen(false)} />
        </div>
      ) : null}
    </div>
  )
}
