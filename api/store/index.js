import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../_lib/http.js'
import { requireAuth } from '../_lib/requireAuth.js'
import { createStore } from '../_lib/storeService.js'
import { storeCreateSchema } from '../../src/schemas/store.js'

/** POST /api/store — create the caller's store. Owner is the verified UID, never a body field. */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  const input = parseBody(storeCreateSchema, req.body)
  await createStore(adminDb(), uid, input)
  sendJson(res, 201, { ok: true, slug: input.slug })
})
