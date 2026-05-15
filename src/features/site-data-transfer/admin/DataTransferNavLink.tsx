'use client'

import { Link, useConfig } from '@payloadcms/ui'

import './data-transfer.scss'

export function DataTransferNavLink() {
  const { config } = useConfig()

  return (
    <Link className="site-data-transfer-nav-link" href={`${config.routes.admin}/data-transfer`}>
      Data transfer
    </Link>
  )
}

export default DataTransferNavLink
