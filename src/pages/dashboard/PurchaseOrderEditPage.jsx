import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { PoActions } from '../../components/po/PoActions'
import { PoForm } from '../../components/po/PoForm'
import { PoItemsCard } from '../../components/po/PoItemsCard'
import { PoStatusBadge } from '../../components/po/PoStatusBadge'
import { PoSummaryCard } from '../../components/po/PoSummaryCard'
import { useAuth } from '../../hooks/useAuth'
import { usePurchaseOrder } from '../../hooks/usePurchaseOrders'
import { useStore } from '../../hooks/useStore'
import { deleteDraftPurchaseOrder, transitionPurchaseOrder } from '../../services/purchaseOrderService'
import { isPoEditable, PO_STATUS_META } from '../../lib/poStatus'

function BackLink() {
  return (
    <Link to="/dashboard/po" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
      <ArrowLeft className="size-4" aria-hidden="true" /> Semua PO
    </Link>
  )
}

function NewPo() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink />
      <h2 className="mb-4 text-xl font-bold text-slate-900">PO baru</h2>
      <PoForm uid={user.uid} po={null} onSaved={(id) => navigate(`/dashboard/po/${id}`, { replace: true })} />
    </div>
  )
}

function ExistingPo({ poId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { store } = useStore()
  const { data: po, loading, error, reload } = usePurchaseOrder(poId)
  const [notice, setNotice] = useState('')

  if (loading) return <div className="mx-auto max-w-2xl space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>
  if (error) return <Card><ErrorState description={error} onRetry={reload} /></Card>
  if (!po) return <Card><EmptyState title="PO tidak ditemukan" action={<Button to="/dashboard/po">Kembali</Button>} /></Card>

  const editable = isPoEditable(po.status)

  const runAction = async (action) => {
    const { status } = await transitionPurchaseOrder(po.id, action)
    setNotice(`Status PO sekarang: ${PO_STATUS_META[status]?.label ?? status}.`)
    reload()
  }

  const runDelete = async () => {
    await deleteDraftPurchaseOrder(user.uid, po.id)
    navigate('/dashboard/po', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <BackLink />
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-xl font-bold text-slate-900">{po.title}</h2>
          <PoStatusBadge status={po.status} />
        </div>
      </div>

      {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{notice}</p>}

      <PoActions key={po.status} po={po} onAction={runAction} onDelete={runDelete} />

      {po.status !== 'DRAFT' && <PoSummaryCard po={po} storeSlug={store?.slug} />}

      {editable ? (
        <PoForm
          key={po.updatedAt?.seconds ?? 'initial'}
          uid={user.uid}
          po={po}
          onSaved={() => {
            setNotice('Perubahan disimpan.')
            reload()
          }}
        />
      ) : null}

      <PoItemsCard uid={user.uid} po={po} editable={editable} />
    </div>
  )
}

export default function PurchaseOrderEditPage() {
  const { poId } = useParams()
  return poId ? <ExistingPo key={poId} poId={poId} /> : <NewPo />
}
