import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Upload } from 'lucide-react'
import { Button, Textarea } from '../ui'
import { compressImage } from '../../lib/imageCompress'
import { uploadPaymentProof } from '../../services/publicService'

/** Buyer picks a screenshot/photo of the transfer; it is shrunk in the browser, then sent for the seller to verify. */
export function ProofUploader({ orderRef, onUploaded }) {
  const input = useRef(null)
  const [prepared, setPrepared] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => prepared?.previewUrl && URL.revokeObjectURL(prepared.previewUrl), [prepared])

  const pick = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try {
      setPrepared(await compressImage(file))
    } catch (e) {
      setPrepared(null)
      setError(e.message)
    }
  }

  const send = async () => {
    setBusy(true)
    setError('')
    try {
      await uploadPaymentProof({ ...orderRef, image: prepared.base64, note: note.trim() })
      setPrepared(null)
      setNote('')
      await onUploaded()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={pick}
        className="sr-only"
        aria-label="Pilih foto bukti transfer"
      />
      {prepared ? (
        <img
          src={prepared.previewUrl}
          alt="Pratinjau bukti transfer"
          className="max-h-72 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-600"
        >
          <ImagePlus className="size-6 text-slate-400" aria-hidden="true" />
          Pilih foto bukti transfer
        </button>
      )}
      {prepared && (
        <>
          <Textarea label="Catatan (opsional)" rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>
              Ganti foto
            </Button>
            <Button className="flex-1" onClick={send} loading={busy}>
              <Upload className="size-4" aria-hidden="true" /> Kirim bukti
            </Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
