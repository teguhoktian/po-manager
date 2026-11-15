const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export function formatRupiah(value) {
  return rupiah.format(Number.isFinite(value) ? value : 0)
}

/** Gross margin per unit. `percent` is null when the selling price is 0. */
export function calcMargin(sellingPrice, purchaseCost) {
  const price = Number.isFinite(sellingPrice) ? sellingPrice : 0
  const cost = Number.isFinite(purchaseCost) ? purchaseCost : 0
  const amount = price - cost
  return { amount, percent: price > 0 ? Math.round((amount / price) * 100) : null }
}

const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

const toDate = (v) => (typeof v?.toDate === 'function' ? v.toDate() : v instanceof Date ? v : null)

/** Firestore Timestamp | Date → "10 Nov 2026, 09.00" (or "-"). */
export function formatDateTime(value) {
  const d = toDate(value)
  return d ? dateTime.format(d) : '-'
}

/** Firestore Timestamp | Date → value for <input type="datetime-local"> in local time. */
export function toLocalInputValue(value) {
  const d = toDate(value)
  if (!d) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
