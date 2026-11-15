import { z } from 'zod'
import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseQuery, sendPublicJson } from '../../http.js'
import { getPublicPO } from '../../publicService.js'
import { storeSlug } from '../../../../src/schemas/store.js'
import { slug } from '../../../../src/schemas/common.js'

const querySchema = z.object({ storeSlug, poSlug: slug })

/** GET /api/public/po?storeSlug=…&poSlug=… — public PO with sellable products (no cost, no owner data). */
export default handler(['GET'], async (req, res) => {
  const { storeSlug: s, poSlug } = parseQuery(querySchema, req.query)
  const data = await getPublicPO(adminDb(), { storeSlug: s, poSlug, bucket: process.env.FIREBASE_STORAGE_BUCKET })
  sendPublicJson(res, 200, data)
})
