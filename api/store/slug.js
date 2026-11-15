import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../_lib/http.js'
import { requireAuth } from '../_lib/requireAuth.js'
import { changeStoreSlug } from '../_lib/storeService.js'
import { storeSlugChangeSchema } from '../../src/schemas/store.js'

/** PUT /api/store/slug — change the caller's store address. */
export default handler(['PUT'], async (req, res) => {
  const { uid } = await requireAuth(req)
  const { slug } = parseBody(storeSlugChangeSchema, req.body)
  await changeStoreSlug(adminDb(), uid, slug)
  sendJson(res, 200, { ok: true, slug })
})
