/** Public checkout. The server prices everything; only item ids + quantities + buyer details are sent. */

export async function submitCheckout(payload, signal) {
  let response
  try {
    response = await fetch('/api/public/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
  } catch {
    const error = new Error('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.')
    error.status = 0
    throw error
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error ?? 'Gagal membuat pesanan. Coba lagi.')
    error.status = response.status
    error.fields = data?.fields
    throw error
  }
  return data
}

/**
 * One idempotency key per distinct attempt. A retry of the SAME cart + buyer (e.g. after a timeout)
 * reuses the key, so the server returns the original order instead of creating a duplicate.
 * Any change to the cart or details gets a fresh key.
 */
export function idempotencyKeyFor(storageKey, signature) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
    if (saved?.sig === signature && typeof saved.key === 'string') return saved.key
  } catch {
    // fall through to a fresh key
  }
  const key = crypto.randomUUID().replaceAll('-', '')
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ key, sig: signature }))
  } catch {
    // storage unavailable: key lives only for this attempt
  }
  return key
}

export const clearIdempotencyKey = (storageKey) => {
  try {
    sessionStorage.removeItem(storageKey)
  } catch {
    // ignore
  }
}

export const receiptStorageKey = (storeSlug, poSlug) => `receipt:${storeSlug}/${poSlug}`

export function saveReceipt(storeSlug, poSlug, receipt) {
  try {
    sessionStorage.setItem(receiptStorageKey(storeSlug, poSlug), JSON.stringify(receipt))
  } catch {
    // The confirmation page then redirects back; the order itself is already saved on the server.
  }
}

export function loadReceipt(storeSlug, poSlug) {
  try {
    const receipt = JSON.parse(sessionStorage.getItem(receiptStorageKey(storeSlug, poSlug)) ?? 'null')
    return receipt && typeof receipt.orderNumber === 'string' && Array.isArray(receipt.items) ? receipt : null
  } catch {
    return null
  }
}
