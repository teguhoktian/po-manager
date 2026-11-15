import { readdirSync } from 'node:fs'
import { join } from 'node:path'

// Vercel Hobby: max 12 Serverless Functions per deployment. Every .js under api/ that is not in a "_" folder/file counts.
const LIMIT = 12
const found = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (entry.name.endsWith('.js')) found.push(path)
  }
}
walk('api')
console.log(`${found.length}/${LIMIT} Vercel Functions:\n  ${found.join('\n  ')}`)
if (found.length > LIMIT) {
  console.error(`Too many functions (${found.length} > ${LIMIT}). Group endpoints in api/<group>/[action].js.`)
  process.exit(1)
}
