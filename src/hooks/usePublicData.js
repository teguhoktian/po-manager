import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPublicOrder, fetchPublicPo, fetchPublicStore } from '../services/publicService'

/** Loads public data; error = { status, message } so pages can tell "not found" from "try again". */
function usePublicResource(loader, key) {
  const [state, setState] = useState({ key: null, data: null, error: null })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    const run = { cancelled: false }
    loaderRef
      .current()
      .then((data) => !run.cancelled && setState({ key: `${key}:${nonce}`, data, error: null }))
      .catch((error) => {
        if (run.cancelled) return
        setState({ key: `${key}:${nonce}`, data: null, error: { status: error?.status ?? 0, message: error?.message ?? 'Gagal memuat' } })
      })
    return () => {
      run.cancelled = true
    }
  }, [key, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  // Loading until the result for the *current* key arrived (also covers navigating between slugs).
  const loading = state.key !== `${key}:${nonce}`
  return { data: loading ? null : state.data, error: loading ? null : state.error, loading, reload, version: nonce }
}

export const usePublicStore = (storeSlug) => usePublicResource(() => fetchPublicStore(storeSlug), `store:${storeSlug}`)
export const usePublicPo = (storeSlug, poSlug) => usePublicResource(() => fetchPublicPo(storeSlug, poSlug), `po:${storeSlug}/${poSlug}`)
export const usePublicOrder = (ref) =>
  usePublicResource(
    () => (ref ? fetchPublicOrder(ref) : Promise.resolve(null)),
    ref ? `order:${ref.storeSlug}/${ref.orderNumber}/${ref.token}` : 'order:none',
  )
