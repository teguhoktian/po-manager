/** Error carrying an HTTP status and a client-safe message (+ optional per-field messages). */
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export function sendJson(res, status, body) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(body)
}

/** Public read responses: short edge cache; never used for anything user-specific. */
export function sendPublicJson(res, status, body) {
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30')
  res.status(status).json(body)
}

/** Validate query-string params with a Zod schema (400 on failure). */
export function parseQuery(schema, raw) {
  const result = schema.safeParse(raw ?? {})
  if (!result.success) throw new HttpError(400, 'Parameter tidak valid')
  return result.data
}

/** Validate a request body with a Zod schema. Unknown/invalid input becomes a 400 with safe field messages. */
export function parseBody(schema, raw) {
  let data = raw
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw)
    } catch {
      throw new HttpError(400, 'Body tidak valid')
    }
  }
  const result = schema.safeParse(data)
  if (!result.success) {
    const fields = {}
    for (const issue of result.error.issues) fields[issue.path.join('.') || '_'] ??= issue.message
    throw new HttpError(400, 'Data tidak valid', fields)
  }
  return result.data
}

/** Wrap a handler: enforce allowed methods and convert errors into safe responses (no internals leaked). */
export function handler(methods, fn) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '))
        throw new HttpError(405, 'Method not allowed')
      }
      await fn(req, res)
    } catch (error) {
      if (error instanceof HttpError) {
        return sendJson(res, error.status, { error: error.message, ...(error.fields && { fields: error.fields }) })
      }
      console.error('API error:', error?.code ?? error?.name ?? 'unknown')
      return sendJson(res, 500, { error: 'Terjadi kesalahan pada server' })
    }
  }
}
