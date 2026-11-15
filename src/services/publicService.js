/** Public (no login) reads. Served by /api/public/*, which only returns whitelisted fields. */

async function get(path, params, signal) {
  const response = await fetch(`${path}?${new URLSearchParams(params)}`, { signal, headers: { Accept: 'application/json' } })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error ?? `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

export const fetchPublicStore = (storeSlug, signal) => get('/api/public/store', { storeSlug }, signal)
export const fetchPublicPo = (storeSlug, poSlug, signal) => get('/api/public/po', { storeSlug, poSlug }, signal)

async function post(path, body, signal) {
  let response
  try {
    response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal })
  } catch {
    const error = new Error('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.')
    error.status = 0
    throw error
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error ?? `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

/** Buyer's order status. POST so the secret token stays out of URLs and logs. */
export const fetchPublicOrder = ({ storeSlug, orderNumber, token }, signal) => post('/api/public/order', { storeSlug, orderNumber, token }, signal)

export const uploadPaymentProof = ({ storeSlug, orderNumber, token, image, note }) =>
  post('/api/public/payment-proof', { storeSlug, orderNumber, token, image, ...(note ? { note } : {}) })
