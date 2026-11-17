import { getToken } from 'firebase/app-check'
import { appCheck, auth } from '../firebase/config'

/**
 * Call an API endpoint as the signed-in user.
 * Sends the Firebase ID token (and App Check token when enabled); the server derives identity from them,
 * never from request body fields.
 */
async function authHeaders() {
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
  return headers
}

async function parse(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`)
  return data
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = await authHeaders()
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  return parse(
    await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    }),
  )
}

/** Send a file's raw bytes (e.g. an optimized image) as the signed-in user. */
export async function apiUpload(path, file) {
  const headers = await authHeaders()
  headers['Content-Type'] = 'application/octet-stream' // the server identifies the real type from the bytes
  return parse(await fetch(path, { method: 'PUT', headers, body: file }))
}
