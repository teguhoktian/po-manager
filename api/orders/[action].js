import { router } from '../_lib/router.js'
import cancel from '../_lib/routes/orders/cancel.js'
import fulfillment from '../_lib/routes/orders/fulfillment.js'
import fulfillmentBulk from '../_lib/routes/orders/fulfillment-bulk.js'
import shipment from '../_lib/routes/orders/shipment.js'

export default router({ cancel, fulfillment, 'fulfillment-bulk': fulfillmentBulk, shipment })
