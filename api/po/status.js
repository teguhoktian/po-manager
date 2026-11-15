import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../_lib/http.js'
import { requireAuth } from '../_lib/requireAuth.js'
import { transitionPO } from '../_lib/poService.js'
import { poTransitionSchema } from '../../src/schemas/purchaseOrder.js'

/** POST /api/po/status { poId, action } — the only way a PO's status can change. */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  const { poId, action } = parseBody(poTransitionSchema, req.body)
  const { status } = await transitionPO(adminDb(), uid, poId, action)
  sendJson(res, 200, { ok: true, status })
})
