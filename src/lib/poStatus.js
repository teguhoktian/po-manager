import { PO_ACTIONS } from '../constants/statuses'

export const PO_STATUS_META = {
  DRAFT: { label: 'Draf', tone: 'neutral' },
  SCHEDULED: { label: 'Terjadwal', tone: 'info' },
  OPEN: { label: 'Dibuka', tone: 'success' },
  CLOSED: { label: 'Ditutup', tone: 'warning' },
  PROCESSING: { label: 'Diproses', tone: 'brand' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
}

/** Filter tabs for the PO list. */
export const PO_GROUPS = [
  { key: 'active', label: 'Aktif', statuses: ['SCHEDULED', 'OPEN'] },
  { key: 'draft', label: 'Draf', statuses: ['DRAFT'] },
  { key: 'running', label: 'Berjalan', statuses: ['CLOSED', 'PROCESSING'] },
  { key: 'done', label: 'Selesai', statuses: ['COMPLETED', 'CANCELLED'] },
]

/** Content and items can only be edited before the PO opens (mirrors firestore.rules). */
export const isPoEditable = (status) => status === 'DRAFT' || status === 'SCHEDULED'

/**
 * Actions a seller may trigger from the given status, in display order.
 * A draft is deleted rather than cancelled. The server refuses to cancel a PO that still has active orders.
 */
export function availableActions(po) {
  return Object.entries(PO_ACTIONS)
    .filter(([, def]) => def.from.includes(po.status))
    .filter(([action]) => action !== 'cancel' || po.status !== 'DRAFT')
    .map(([action]) => action)
}
