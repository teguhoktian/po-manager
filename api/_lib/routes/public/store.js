import { z } from 'zod'
import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseQuery, sendPublicJson } from '../../http.js'
import { getPublicStore } from '../../publicService.js'
import { storeSlug } from '../../../../src/schemas/store.js'

const querySchema = z.object({ storeSlug })

/** GET /api/public/store?storeSlug=… — public store profile + listed POs (whitelisted fields only). */
export default handler(['GET'], async (req, res) => {
  const { storeSlug: slug } = parseQuery(querySchema, req.query)
  const data = await getPublicStore(adminDb(), { storeSlug: slug })
  sendPublicJson(res, 200, data)
})
