import { after, before, describe, it } from 'node:test'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { getBytes, ref, uploadBytes } from 'firebase/storage'
import { ALICE, BOB, createEnv } from './helpers.js'

let env
const as = (uid) => env.authenticatedContext(uid).storage()
const png = new Uint8Array([137, 80, 78, 71])
const meta = (contentType) => ({ contentType })

before(async () => {
  env = await createEnv()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), `sellers/${ALICE}/products/p1/a.png`), png, meta('image/png'))
    await uploadBytes(ref(ctx.storage(), `sellers/${ALICE}/payment-proofs/o1/proof.png`), png, meta('image/png'))
  })
})
after(async () => { await env.cleanup() })

describe('storage', () => {
  it('lets owners upload small images only', async () => {
    await assertSucceeds(uploadBytes(ref(as(ALICE), `sellers/${ALICE}/products/p2/b.png`), png, meta('image/png')))
    await assertFails(uploadBytes(ref(as(ALICE), `sellers/${ALICE}/products/p2/c.txt`), png, meta('text/plain')))
    await assertFails(uploadBytes(ref(as(ALICE), `sellers/${ALICE}/products/p2/d.png`), new Uint8Array(2 * 1024 * 1024 + 1), meta('image/png')))
    await assertFails(uploadBytes(ref(as(ALICE), `sellers/${ALICE}/products/p2/e.svg`), png, meta('image/svg+xml')))
  })
  it("denies writing into another seller's folder", async () => {
    await assertFails(uploadBytes(ref(as(BOB), `sellers/${ALICE}/products/p2/x.png`), png, meta('image/png')))
  })
  it('serves catalog images publicly', async () => {
    await assertSucceeds(getBytes(ref(env.unauthenticatedContext().storage(), `sellers/${ALICE}/products/p1/a.png`)))
  })
  it('keeps payment proofs private and server-written', async () => {
    const path = `sellers/${ALICE}/payment-proofs/o1/proof.png`
    await assertSucceeds(getBytes(ref(as(ALICE), path)))
    await assertFails(getBytes(ref(as(BOB), path)))
    await assertFails(getBytes(ref(env.unauthenticatedContext().storage(), path)))
    await assertFails(uploadBytes(ref(as(ALICE), `sellers/${ALICE}/payment-proofs/o1/new.png`), png, meta('image/png')))
  })
})
