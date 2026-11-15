import { useState } from 'react'
import { Button, ConfirmDialog } from '../ui'
import { availableActions } from '../../lib/poStatus'

const ACTION_UI = {
  publish: {
    label: 'Publikasikan', variant: 'primary',
    confirm: { title: 'Publikasikan PO?', description: 'PO akan dibuka sesuai jadwal. Setelah PO dibuka, produk dan pengaturannya tidak bisa diubah lagi.', confirmLabel: 'Ya, publikasikan' },
  },
  open: {
    label: 'Buka sekarang', variant: 'primary',
    confirm: { title: 'Buka PO sekarang?', description: 'PO langsung menerima pesanan dan jadwal buka disesuaikan ke waktu sekarang.', confirmLabel: 'Ya, buka' },
  },
  unschedule: { label: 'Kembalikan ke draf', variant: 'secondary' },
  close: {
    label: 'Tutup PO', variant: 'secondary',
    confirm: { title: 'Tutup PO sekarang?', description: 'Pesanan baru tidak akan diterima lagi. Pesanan yang sudah masuk tetap tersimpan.', confirmLabel: 'Ya, tutup PO' },
  },
  reopen: {
    label: 'Buka kembali', variant: 'primary',
    confirm: { title: 'Buka PO kembali?', description: 'PO kembali menerima pesanan sampai batas waktu dan kuota yang ada.', confirmLabel: 'Ya, buka kembali' },
  },
  process: {
    label: 'Mulai proses', variant: 'primary',
    confirm: { title: 'Mulai memproses PO?', description: 'Tandai bahwa kamu mulai menyiapkan pesanan PO ini.', confirmLabel: 'Ya, mulai' },
  },
  complete: {
    label: 'Tandai selesai', variant: 'primary',
    confirm: { title: 'Tandai PO selesai?', description: 'PO akan masuk ke riwayat dan tidak bisa diubah lagi.', confirmLabel: 'Ya, selesai' },
  },
  cancel: {
    label: 'Batalkan PO', variant: 'ghost', danger: true,
    confirm: { title: 'Batalkan PO?', description: 'PO tidak akan bisa dibuka lagi. Tindakan ini tidak bisa dibatalkan.', confirmLabel: 'Ya, batalkan', destructive: true },
  },
}

const DELETE_UI = {
  label: 'Hapus draf', variant: 'ghost', danger: true,
  confirm: { title: 'Hapus draf PO?', description: 'Draf dan daftar produknya dihapus permanen.', confirmLabel: 'Ya, hapus', destructive: true },
}

/** Status-dependent buttons. `onAction(action)` / `onDelete()` must throw Error(message) on failure. */
export function PoActions({ po, onAction, onDelete }) {
  const [pending, setPending] = useState(null) // { key, ui }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const buttons = availableActions(po).map((key) => ({ key, ui: ACTION_UI[key] }))
  if (po.status === 'DRAFT') buttons.push({ key: 'delete', ui: DELETE_UI })

  if (!buttons.length) return <p className="text-sm text-slate-500">PO ini sudah final dan tidak bisa diubah.</p>

  const run = async (key) => {
    setBusy(true)
    setError('')
    try {
      await (key === 'delete' ? onDelete() : onAction(key))
      setPending(null)
    } catch (e) {
      setPending(null)
      setError(e.message || 'Aksi gagal. Coba lagi.')
    } finally {
      setBusy(false)
    }
  }

  const click = ({ key, ui }) => (ui.confirm ? setPending({ key, ui }) : run(key))

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {buttons.map((b) => (
          <Button
            key={b.key}
            variant={b.ui.variant}
            onClick={() => click(b)}
            disabled={busy}
            className={b.ui.danger ? '!text-red-600 hover:bg-red-50' : undefined}
          >
            {b.ui.label}
          </Button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.ui.confirm.title ?? ''}
        description={pending?.ui.confirm.description}
        confirmLabel={pending?.ui.confirm.confirmLabel}
        destructive={pending?.ui.confirm.destructive}
        loading={busy}
        onConfirm={() => run(pending.key)}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
