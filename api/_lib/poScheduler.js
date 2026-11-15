import { Timestamp } from 'firebase-admin/firestore'
import { PO_CLOSE_REASON, PO_STATUS } from '../../src/constants/statuses.js'
import { writeAudit } from './audit.js'

const toMillis = (v) => (typeof v?.toMillis === 'function' ? v.toMillis() : v ? new Date(v).getTime() : null)

/** What the schedule says this PO should be right now, or null when nothing has to change. */
export function dueTransition(po, nowMs) {
  const openDue = po.status === PO_STATUS.SCHEDULED && toMillis(po.openAt) <= nowMs
  const closeDue = (po.status === PO_STATUS.OPEN || openDue) && toMillis(po.closeAt) <= nowMs
  if (closeDue) return { opens: openDue, to: PO_STATUS.CLOSED }
  if (openDue) return { opens: true, to: PO_STATUS.OPEN }
  return null
}

/**
 * Persist what buyers already experience (effectiveState): scheduled POs open at `openAt`, open POs close at `closeAt`.
 * Runs from the cron endpoint (no user, so audit actor is "system"). Each PO is re-read inside its own transaction,
 * so a seller's change made in the meantime wins. Returns counts for logging.
 */
export async function sweepPurchaseOrders(db, now = new Date()) {
  const snap = await db.collection('purchase_orders').where('status', 'in', [PO_STATUS.SCHEDULED, PO_STATUS.OPEN]).get()
  const candidates = snap.docs.filter((d) => dueTransition(d.data(), now.getTime()))
  const result = { checked: snap.docs.length, opened: 0, closed: 0 }

  for (const candidate of candidates) {
    const ref = db.collection('purchase_orders').doc(candidate.id)
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref)
      if (!fresh.exists) return
      const po = fresh.data()
      const due = dueTransition(po, now.getTime())
      if (!due) return
      const stamp = Timestamp.fromDate(now)
      const update = { status: due.to, updatedAt: stamp }
      if (due.to === PO_STATUS.CLOSED) Object.assign(update, { closedAt: stamp, closeReason: PO_CLOSE_REASON.DEADLINE })
      tx.update(ref, update)
      const base = { sellerId: po.sellerId, actorUid: 'system', entityType: 'purchase_order', entityId: candidate.id }
      if (due.opens) writeAudit(tx, db, { ...base, action: 'PO_AUTO_OPEN', meta: { from: po.status, to: PO_STATUS.OPEN } })
      if (due.to === PO_STATUS.CLOSED) writeAudit(tx, db, { ...base, action: 'PO_AUTO_CLOSE', meta: { from: due.opens ? PO_STATUS.OPEN : po.status, to: due.to } })
      result[due.to === PO_STATUS.CLOSED ? 'closed' : 'opened'] += 1
    })
  }
  return result
}
