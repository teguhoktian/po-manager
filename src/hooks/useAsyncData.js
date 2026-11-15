import { useCallback, useEffect, useRef, useState } from 'react'
import { describeFirebaseError } from '../lib/firebaseErrors'

/**
 * Load data with loading/error state. Reloads when `key` changes or `reload()` is called
 * (current data stays visible during a reload). Pass a null key to skip loading.
 */
export function useAsyncData(loader, key, errorFallback = 'Gagal memuat data.') {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    if (key == null) return undefined
    const run = { cancelled: false }
    loaderRef
      .current()
      .then((data) => !run.cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => {
        console.error('[useAsyncData]', error?.code, error?.message)
        if (!run.cancelled) setState({ data: null, loading: false, error: describeFirebaseError(error, errorFallback) })
      })
    return () => {
      run.cancelled = true
    }
  }, [key, nonce, errorFallback])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}
