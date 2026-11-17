// Manual check of the Supabase Storage setup (run on your computer with your real keys):
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/storageSmoke.mjs
import { publicFileUrl, removeFile, saveFile, signProofUrl } from '../api/_lib/fileStore.js'

const uid = 'smoketest'
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([20, 0, 0, 0]), Buffer.from('WEBP'), Buffer.alloc(40, 1)])
const pub = `sellers/${uid}/store/smoke-${Date.now()}.webp`
const proof = `sellers/${uid}/payment-proofs/order1/smoke-${Date.now()}.webp`

const check = (ok, message) => {
  if (!ok) {
    console.error('FAIL:', message)
    process.exitCode = 1
  } else console.log('ok  :', message)
}

try {
  await saveFile(pub, webp)
  check((await fetch(publicFileUrl(pub))).status === 200, 'public image is readable from the public bucket')
  await saveFile(proof, webp)
  const signed = await signProofUrl(proof)
  check((await fetch(signed)).status === 200, 'private proof opens with a signed link')
  const direct = `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/storage/v1/object/public/po-private/${proof}`
  check((await fetch(direct)).status !== 200, 'private proof is NOT readable without the signed link')
} catch (error) {
  console.error('FAIL:', error?.message)
  process.exitCode = 1
} finally {
  await removeFile(pub).catch(() => {})
  await removeFile(proof).catch(() => {})
}
console.log(process.exitCode ? 'GAGAL' : 'OK')
