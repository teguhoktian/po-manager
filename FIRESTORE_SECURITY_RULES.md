# Firestore & Storage Security Architecture — PO Manager

Files: `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`.
Shared vocabularies: `src/constants/statuses.js`, `src/constants/collections.js`. Client validation mirrors the rules in `src/schemas/*`.

## 1. Principles

1. **Default deny.** Anything not explicitly allowed is refused (`match /{document=**}` → false).
2. **Ownership by field.** Every business document has `sellerId` = owner's Firebase UID. Rules compare it with `request.auth.uid`; the browser never decides ownership.
3. **Three trust zones**
   - *Seller client* (authenticated browser): may write catalog data and PO **drafts** only.
   - *Server* (Vercel Functions + Admin SDK, bypasses rules): sole writer of orders, payments, shipments, audit logs, PO status/counters, store creation, slugs, idempotency and rate-limit data.
   - *Public visitor*: **no direct Firestore/Storage list access**. Public pages read through server APIs that return whitelisted fields only (never `purchaseCost`, never other customers' data).
4. **Whitelisted writes.** Creates use `keys().hasOnly()` + `hasAll()`; updates use `diff().affectedKeys().hasOnly()`, so unknown or protected fields can never be injected (mass assignment).
5. **Server time.** `createdAt` / `updatedAt` must equal `request.time` (client uses `serverTimestamp()`).
6. **Money** is integer rupiah, `0 … 1,000,000,000`. Orders store price **snapshots**; totals are computed server-side from server-held prices.

## 2. Data model

IDs are auto IDs unless noted. All timestamps are Firestore `Timestamp`.

| Collection | Doc ID | Key fields | Written by |
|---|---|---|---|
| `users` | `{uid}` | displayName, email | seller (limited) |
| `stores` | `{uid}` (1 per seller) | sellerId, name, slug, description, whatsappNumber, logoPath | **server** create; seller edits profile fields |
| `products` | auto | sellerId, storeId, name, slug, description, imagePaths[≤5], sellingPrice, purchaseCost, trackStock, stock, hasVariants, status(ACTIVE/ARCHIVED) | seller |
| `product_variants` | auto | sellerId, productId, name, sellingPrice, purchaseCost, stock, status | seller |
| `purchase_orders` | auto | sellerId, storeId, title, slug, description, paymentMode(FULL/DP), dpPercent, openAt, closeAt, quota, minOrderQty, **status, orderedQty, orderCount, closedAt, closeReason** | seller (draft content); **server** (bold fields) |
| `purchase_order_items` | auto | sellerId, poId, productId, variantId, sellingPrice (snapshot) | seller while PO is DRAFT/SCHEDULED |
| `orders` | auto | sellerId, storeId, poId, orderNumber, idempotencyKey, customer{name,whatsapp,address}, subtotal, total, paidAmount, balanceDue, paymentMode, dpAmount, `status`(ACTIVE/CANCELLED), `paymentStatus`, `fulfillmentStatus` | **server only** |
| `order_items` | auto | sellerId, orderId, poId, productId, variantId, name/variant snapshots, unitPrice, unitCost, quantity, lineTotal | **server only** |
| `payments` | auto | sellerId, orderId, type(DP/FULL/BALANCE/REFUND), amount, proofPath, status(SUBMITTED/VERIFIED/REJECTED), verifiedAt | **server only** |
| `shipments` | auto | sellerId, orderId, carrier, trackingNumber, status, timestamps | **server only** |
| `audit_logs` | auto | sellerId, actorUid, action, entityType, entityId, meta, createdAt | **server only**, append-only |
| `store_slugs` | `{slug}` | sellerId | server only (uniqueness claim) |
| `idempotency_keys` | hash of key | orderId, createdAt | server only |
| `rate_limits` | bucket key | count, windowStart | server only |

**Status vocabularies** (`src/constants/statuses.js`)
- PO: `DRAFT → SCHEDULED → OPEN → CLOSED → PROCESSING → COMPLETED`, plus `CANCELLED`. Transition table `PO_TRANSITIONS` is enforced by the server.
- Order payment: `PENDING_PAYMENT → PARTIALLY_PAID → PAID` (+ `REFUNDED`).
- Order fulfillment (separate field): `PENDING → PROCESSING → PACKED → SHIPPED → COMPLETED`.
- Order `status`: `ACTIVE | CANCELLED`.

**Indexes** are in `firestore.indexes.json`; every seller query is `where('sellerId','==',uid)` + filter/sort. Deploy with `firebase deploy --only firestore:indexes`.

## 3. Access matrix (client SDK)

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| users | owner | owner (strict fields, email must match token) | owner: displayName | ✗ |
| stores | owner | ✗ (server) | owner: name, description, whatsappNumber, logoPath (not slug/sellerId) | ✗ |
| products | owner | owner (storeId == uid) | owner (whitelist) | ✗ (archive instead) |
| product_variants | owner | owner + parent product owned | owner (whitelist) | ✗ |
| purchase_orders | owner | owner, **status must be DRAFT**, counters 0 | owner **only while DRAFT/SCHEDULED**, content fields only; slug frozen after DRAFT | owner, DRAFT only |
| purchase_order_items | owner | owner, PO owned and DRAFT/SCHEDULED, product owned | price only, PO editable | PO editable |
| orders, order_items, payments, shipments, audit_logs | owner | ✗ | ✗ | ✗ |
| store_slugs, idempotency_keys, rate_limits, anything else | ✗ | ✗ | ✗ | ✗ |

List queries must include `where('sellerId','==',uid)`; otherwise the rules reject them.

## 4. Storage

| Path | get | list | write |
|---|---|---|---|
| `sellers/{uid}/store/{file}` | public | ✗ | owner; image/jpeg\|png\|webp, ≤ 2 MB, safe filename |
| `sellers/{uid}/products/{productId}/{file}` | public | ✗ | same as above |
| `sellers/{uid}/payment-proofs/{orderId}/{file}` | owner | ✗ | ✗ (server uploads via Admin SDK after validating type/size) |
| everything else | ✗ | ✗ | ✗ |

SVG is intentionally excluded (script-capable). Customers never get Storage write access.

## 5. Server responsibilities (later phases)

Rules cannot do these; the API layer must:
- Create the store and claim `store_slugs/{slug}` in one transaction (**implemented**: `POST /api/store`; slug changes via `PUT /api/store/slug`, which also releases the old claim and writes an audit log).
- Verify the ID token, derive `uid`, load the document, and check `sellerId == uid` before any privileged action (`api/_lib/requireAuth.js`).
- Public checkout: Zod-validate, rate limit, check `idempotency_keys`, then in **one Firestore transaction** verify PO is OPEN and within dates, check quota, compute totals from stored prices, write order + items, increment `orderedQty`/`orderCount`, and close the PO when quota is reached.
- PO status transitions (**implemented**: `POST /api/po/status` with actions publish / open / unschedule / close / process / complete / cancel — transactional, ownership-checked, publish re-validates items, products, variants, dates and slug uniqueness, and every change writes an `audit_logs` entry). Still to come: deadline/quota auto-close (scheduled job), payment verification, shipment updates.
- Product/PO slug uniqueness per store at PO publish time (rules cannot run queries).
- Validate `imagePaths` belong to `sellers/{uid}/…` before returning them publicly (**implemented** in `publicService.js`).
- Validate payment-proof uploads (type, size, magic bytes) before writing to Storage.

### Public read API (Phase 07, implemented)
`GET /api/public/store?storeSlug=` and `GET /api/public/po?storeSlug=&poSlug=` (`api/_lib/publicService.js`) are the only public reads:
- Store resolved via `store_slugs/{slug}` and cross-checked (`sellerId`, `slug`) against `stores/{uid}`; all lookups are scoped by that `sellerId`.
- Only PO statuses SCHEDULED/OPEN/CLOSED/PROCESSING/COMPLETED are visible (DRAFT and CANCELLED return 404, same as unknown).
- Output is whitelisted per field: no `purchaseCost`, `sellerId`, `orderCount`, counters (only remaining quota), or customer data. Prices come from the PO item snapshot.
- `imagePaths` are accepted only under `sellers/{sellerId}/` with no `..`; anything else is dropped.
- Responses are cacheable at the edge for 15 s (`s-maxage`); state (open/closed/full) is recomputed server-side per request and in the browser as the deadline passes.
- Rate limiting for public reads is not implemented yet (Phase 13); checkout (Phase 08) gets its own limiter and idempotency.

### Public checkout (Phase 08, implemented)
`POST /api/public/checkout` (`api/_lib/checkoutService.js`). The body carries only item ids, quantities and buyer details; prices, totals, seller and PO state are never client-supplied (`checkoutSchema` is strict).
1. Zod validation + honeypot field (`website`).
2. Rate limits in `rate_limits` (hashed keys): 10 requests / 10 min per IP, 5 / hour per WhatsApp number. Exceeding returns 429.
3. One Firestore transaction: idempotency lookup → PO must be effectively OPEN (status, dates, quota) → items must belong to that PO and seller → products/variants ACTIVE → stock check → totals from the PO item price snapshot → write `orders`, `order_items` (with `unitCost` snapshot), decrement tracked stock, bump `orderedQty`/`orderCount`, close the PO with `closeReason=QUOTA_FULL` when the quota is reached, write `idempotency_keys` (holds the public receipt) and `audit_logs`.
4. Retrying with the same `idempotencyKey` returns the original receipt (HTTP 200, `replayed: true`); no second order, no second stock deduction.
5. The receipt returned to the buyer excludes cost, seller id and the buyer's phone number.
Operational: `rate_limits` and `idempotency_keys` carry `expiresAt`; enable a Firestore TTL policy on that field for both collections so they clean themselves up (Firebase console → Firestore → TTL).

### Order management (Phase 09, implemented)
- Sellers read `orders` / `order_items` directly (rules: owner read, `sellerId` filter required); they never write them.
- `POST /api/orders/cancel` (`api/_lib/orderService.js`): owner check from the verified UID (missing and foreign orders both 404). Allowed only for an ACTIVE order with `PENDING_PAYMENT`, `paidAmount == 0` and `fulfillmentStatus == PENDING`; otherwise 409 and nothing is written. One transaction: order → CANCELLED (`cancelledAt/By/Reason`), stock returned for tracked products/variants, PO `orderedQty` reduced (`orderCount` stays: it is the order-number sequence), audit `ORDER_CANCELLED`.
- `POST /api/po/status` gained `reopen` (CLOSED → OPEN; refused when the deadline passed or the quota is still full) and `cancel` now refuses only while the PO has ACTIVE orders.
- Cancelling an order never reopens a PO that was auto-closed by quota; the seller decides with "Buka kembali".

### Payments (Phase 10, implemented)
- `stores.paymentInfo` (≤500 chars, seller-editable, whitelisted in rules) is shown to buyers after checkout.
- **Buyer access** to an order is a secret token created at checkout; only its SHA-256 is stored (`orders.accessTokenHash`). `POST /api/public/order` (POST so the token never appears in URLs/logs) answers with a whitelisted view; wrong token, wrong number and unknown store all return the same 404. Share link: `/po/{store}/{po}/pesanan?no=…#t=token` (the token is in the URL fragment and is never sent to the server by the browser).
- **Proof upload** `POST /api/public/payment-proof`: the browser shrinks the image to a JPEG (<1 MB); the server accepts base64 up to 1.5 MB, checks the real type by magic bytes (JPG/PNG/WebP only; SVG/PDF/GIF rejected), stores it with the Admin SDK at `sellers/{uid}/payment-proofs/{orderId}/{paymentId}.ext` (owner-read only in `storage.rules`), and creates a `payments` doc `SUBMITTED`. Limits: one pending proof per order, 6 per order, 8 uploads / 10 min per IP, 10 / hour per order.
- **Seller review** `POST /api/payments/review` (verify with the amount actually received, or reject with a reason) and `POST /api/payments/record` (cash / off-app payments, stored as VERIFIED without a proof). Only the server derives `paidAmount`, `balanceDue` and `paymentStatus` (PENDING_PAYMENT → PARTIALLY_PAID → PAID); an amount above the balance is refused.
- **Cancel** now works for paid orders before fulfilment starts when the seller confirms `refund: true`: a `REFUND` payment is recorded, the order becomes `REFUNDED`, stock/quota are restored and any pending proof is auto-rejected.
- Money is never moved by the app: the seller transfers and records manually (no payment gateway).

## 6. Known limits

- Rules check types/ranges but not that `imagePaths` entries have the right prefix (see above).
- `get()` calls in rules (variants, PO items) cost extra reads per write; this is deliberate for ownership integrity.
- Deleting a draft PO does not cascade to its items; orphaned items are inert and unreadable by others.

## 7. Deploy & test

```bash
# Deploy (needs firebase-tools login and a project)
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage

# Rules tests (needs Java 11+ and network access to download the emulators)
npm run test:rules
```

`tests/rules/` covers cross-seller isolation, server-only collections, mass assignment, price validation, PO status/counter protection, locked OPEN POs, item ownership, and Storage type/size/path rules.
Run them against the emulator before every rules deploy.

## Fulfillment

- `shipments/*`: baca hanya pemilik (`sellerId`), tulis `false` (Admin SDK). Rules tidak berubah.
- Perubahan status pengiriman hanya lewat `/api/orders/fulfillment*` (UID dari token terverifikasi, pesanan orang lain = 404, aturan transisi + gerbang pembayaran dihitung server, audit `FULFILLMENT_UPDATED`/`SHIPMENT_UPDATED`).
- Tampilan pembeli hanya mengembalikan `carrier`, `trackingNumber`, `shippedAt`.
