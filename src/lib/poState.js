import { PO_STATUS } from '../constants/statuses.js'

// Shared by the server (public API) and the browser. Keep this file dependency-free and use explicit .js imports.

const toMillis = (v) => (typeof v?.toMillis === 'function' ? v.toMillis() : v ? new Date(v).getTime() : null)

/**
 * What a buyer can do with a PO right now.
 * UPCOMING (scheduled / not open yet) | OPEN | FULL (quota reached) | CLOSED (deadline passed, closed or finished)
 * Accepts Firestore Timestamps, Dates or ISO strings.
 */
export function effectiveState(po, now) {
  const t = now.getTime()
  if (po.status === PO_STATUS.SCHEDULED) return 'UPCOMING'
  if (po.status !== PO_STATUS.OPEN) return 'CLOSED'
  const closeAt = toMillis(po.closeAt)
  const openAt = toMillis(po.openAt)
  if (closeAt != null && closeAt <= t) return 'CLOSED'
  if (openAt != null && openAt > t) return 'UPCOMING'
  if (po.quota != null && (po.orderedQty ?? 0) >= po.quota) return 'FULL'
  return 'OPEN'
}

/** Re-evaluate in the browser as time passes (the page may stay open past the deadline). */
export function liveState(state, closeAt, now) {
  if (state === 'OPEN' && closeAt && new Date(closeAt).getTime() <= now.getTime()) return 'CLOSED'
  return state
}

/** "2 hari 3 jam" / "3 jam 12 menit" / "5 menit" / "kurang dari 1 menit" */
export function formatCountdown(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 'sudah berakhir'
  const min = Math.floor(ms / 60_000)
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return h > 0 ? `${d} hari ${h} jam` : `${d} hari`
  if (h > 0) return m > 0 ? `${h} jam ${m} menit` : `${h} jam`
  return m > 0 ? `${m} menit` : 'kurang dari 1 menit'
}
