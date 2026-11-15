import { FieldValue } from 'firebase-admin/firestore'

/** Append an audit entry inside a transaction/batch. Audit logs are server-written and never updated. */
export function writeAudit(writer, db, { sellerId, actorUid, action, entityType, entityId, meta = {} }) {
  writer.set(db.collection('audit_logs').doc(), {
    sellerId,
    actorUid,
    action,
    entityType,
    entityId,
    meta,
    createdAt: FieldValue.serverTimestamp(),
  })
}
