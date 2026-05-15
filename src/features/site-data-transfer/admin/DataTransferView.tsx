import type { AdminViewServerProps } from 'payload'

import { DataTransferPanel } from './DataTransferPanel'

import './data-transfer.scss'

export function DataTransferView(_props: AdminViewServerProps) {
  return <DataTransferPanel />
}

export default DataTransferView
