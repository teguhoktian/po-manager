import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeTotals, maxQtyFor } from '../lib/pricing'

const read = (key) => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(key) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {} // storage blocked or corrupted: start with an empty cart
  }
}

/**
 * Cart for one PO, kept in sessionStorage (per tab, not shared, never sent anywhere until checkout).
 * Stored data is untrusted: unknown items, sold-out options and over-limit quantities are dropped on load.
 */
export function useCart({ storageKey, products, order, enabled }) {
  const options = useMemo(() => {
    const map = new Map()
    for (const p of products) for (const o of p.options) map.set(o.itemId, { ...o, label: o.name ? `${p.name} · ${o.name}` : p.name })
    return map
  }, [products])

  const [qty, setQty] = useState(() => {
    const stored = read(storageKey)
    const clean = {}
    let used = 0
    for (const [itemId, raw] of Object.entries(stored)) {
      const option = options.get(itemId)
      const n = Number.isInteger(raw) ? raw : 0
      if (!option || option.soldOut || n <= 0) continue
      const max = maxQtyFor(option, { remainingQuota: order.remainingQuota, othersQty: used })
      const q = Math.min(n, max)
      if (q > 0) {
        clean[itemId] = q
        used += q
      }
    }
    return clean
  })

  useEffect(() => {
    try {
      if (Object.keys(qty).length) sessionStorage.setItem(storageKey, JSON.stringify(qty))
      else sessionStorage.removeItem(storageKey)
    } catch {
      // Storage unavailable (private mode): cart lives in memory only.
    }
  }, [qty, storageKey])

  const totalQty = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty])

  const maxFor = useCallback(
    (itemId) => {
      const option = options.get(itemId)
      if (!option || !enabled) return 0
      return maxQtyFor(option, { remainingQuota: order.remainingQuota, othersQty: totalQty - (qty[itemId] ?? 0) })
    },
    [options, enabled, order.remainingQuota, totalQty, qty],
  )

  const setItem = useCallback(
    (itemId, value) => {
      const next = Math.max(0, Math.min(Math.trunc(value) || 0, maxFor(itemId)))
      setQty((prev) => {
        const copy = { ...prev }
        if (next > 0) copy[itemId] = next
        else delete copy[itemId]
        return copy
      })
    },
    [maxFor],
  )

  const clear = useCallback(() => setQty({}), [])

  const lines = useMemo(
    () => Object.entries(qty).flatMap(([itemId, q]) => (options.has(itemId) ? [{ itemId, qty: q, price: options.get(itemId).price, label: options.get(itemId).label }] : [])),
    [qty, options],
  )
  const totals = useMemo(() => computeTotals(lines, order), [lines, order])

  return { qty, lines, totals, totalQty, setItem, clear, maxFor }
}
