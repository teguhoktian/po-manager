import { getToken } from 'firebase/app-check'
import { appCheck, auth } from '../firebase/config'

/**
 * Call a Vercel serverless endpoint as the signed-in user.
 * Sends the Firebase ID token (and App Check token when enabled); the server derives identity from them,
 * never from request body fields.
 */
export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const user = auth?.currentUser
  if (!user) throw new Error('Not authenticated')

  const headers = { Authorization: `Bearer ${await user.getIdToken()}` }
  if (appCheck) {
    try {
      headers['X-Firebase-AppCheck'] = (await getToken(appCheck)).token
    } catch {
      // Server decides whether a missing App Check token is acceptable.
    }
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`)
  return data
}
