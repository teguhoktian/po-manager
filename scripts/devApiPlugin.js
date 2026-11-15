import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv } from 'vite'

/**
 * Dev-only: serve ./api/* handlers (Vercel-style) from `vite dev`, so `npm run dev` works full-stack
 * without the Vercel CLI. Production uses Vercel Functions directly; this plugin never runs in builds.
 */
export function devApiPlugin() {
  let root = process.cwd()

  return {
    name: 'po-manager:dev-api',
    apply: 'serve',
    configResolved(config) {
      root = config.root
      // Make server-only variables (FIREBASE_*, APPCHECK_ENFORCE) visible to handlers, like Vercel does.
      const env = loadEnv(config.mode, root, '')
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith('VITE_') && process.env[key] === undefined) process.env[key] = value
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        const segments = url.pathname.slice(5).split('/').filter(Boolean)
        // Block traversal and private helpers (folders/files starting with "_").
        if (!segments.length || segments.some((s) => s.startsWith('_') || s.includes('..') || s.includes('\\'))) {
          return sendNotFound(res)
        }

        const base = segments.join('/')
        let action
        let file = [`api/${base}.js`, `api/${base}/index.js`].find((f) => existsSync(join(root, f)))
        if (!file && segments.length > 1) {
          // Vercel-style dynamic route: api/<group>/[action].js
          const dynamic = `api/${segments.slice(0, -1).join('/')}/[action].js`
          if (existsSync(join(root, dynamic))) {
            file = dynamic
            action = segments.at(-1)
          }
        }
        if (!file) return sendNotFound(res)

        try {
          req.body = await readBody(req)
          req.query = { ...Object.fromEntries(url.searchParams), ...(action ? { action } : {}) }
          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return res
          }
          const mod = await server.ssrLoadModule(`/${file}`)
          await mod.default(req, res)
        } catch (error) {
          console.error('[dev-api] unhandled:', error?.message)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Terjadi kesalahan pada server' }))
          }
        }
      })
    },
  }
}

function sendNotFound(res) {
  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: 'Not found' }))
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 3_000_000) throw new Error('Body too large')
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text // handler's parseBody reports invalid JSON as 400
  }
}
