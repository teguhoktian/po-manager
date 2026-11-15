import { useEffect, useMemo, useState } from 'react'
import { isFirebaseConfigured } from '../firebase/config'
import { subscribeToAuth } from '../services/authService'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Stay in "loading" until Firebase reports the persisted session; avoids redirect flicker.
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    return subscribeToAuth((nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  const value = useMemo(() => ({ user, loading, isConfigured: isFirebaseConfigured }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
