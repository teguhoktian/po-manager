/** Only allow same-origin absolute paths (e.g. "/dashboard"); anything else falls back. Blocks open redirects. */
export function safeRedirectPath(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
