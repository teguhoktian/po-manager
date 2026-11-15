import { useEffect, useState } from 'react'
import { getImageUrl } from '../services/imageService'

const cache = new Map()

/** Resolve a Storage path to a download URL (cached per session). Returns null until ready. */
export function useStorageUrl(path) {
  const [state, setState] = useState({ path: null, url: null })

  useEffect(() => {
    if (!path || cache.has(path)) return undefined
    let cancelled = false
    getImageUrl(path)
      .then((url) => {
        cache.set(path, url)
        if (!cancelled) setState({ path, url })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [path])

  if (!path) return null
  return cache.get(path) ?? (state.path === path ? state.url : null)
}
