import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { getStore } from '../services/storeService'
import { describeFirebaseError } from '../lib/firebaseErrors'

/** Loads the current seller's store. `store === null` with no error means "not created yet". */
export function useStore() {
  const { user } = useAuth()
  const uid = user?.uid
  const [state, setState] = useState({ store: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!uid) return undefined
    let cancelled = false
    getStore(uid)
      .then((store) => !cancelled && setState({ store, loading: false, error: null }))
      .catch((error) => {
        console.error('[useStore] failed to load store:', error?.code, error?.message)
        if (!cancelled) setState({ store: null, loading: false, error: describeFirebaseError(error, 'Gagal memuat data toko.') })
      })
    return () => {
      cancelled = true
    }
  }, [uid, nonce])

  /** Refetch in the background (keeps current data on screen while loading). */
  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, reload }
}
