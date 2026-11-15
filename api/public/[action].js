import { router } from '../_lib/router.js'
import checkout from '../_lib/routes/public/checkout.js'
import order from '../_lib/routes/public/order.js'
import paymentProof from '../_lib/routes/public/payment-proof.js'
import track from '../_lib/routes/public/track.js'
import po from '../_lib/routes/public/po.js'
import store from '../_lib/routes/public/store.js'

export default router({ checkout, order, 'payment-proof': paymentProof, po, store, track })
