'use client'

import { Button, Popup, useDocumentInfo } from '@payloadcms/ui'

import { PostPackageImportPanel } from './PostPackageImportPanel'

export function PostPackageImportAction() {
  const { collectionSlug } = useDocumentInfo()

  if (collectionSlug !== 'posts') {
    return null
  }

  return (
    <Popup
      button={
        <Button
          buttonStyle="secondary"
          el="div"
          extraButtonProps={{
            'data-testid': 'post-import-trigger',
          }}
          size="small"
        >
          Import
        </Button>
      }
      buttonType="custom"
      horizontalAlign="right"
      id="post-package-import"
      noBackground
      portalClassName="post-package-import-popup"
      render={({ close }) => <PostPackageImportPanel onComplete={close} />}
      showScrollbar
      size="large"
      verticalAlign="bottom"
    />
  )
}
