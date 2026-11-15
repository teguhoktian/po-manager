import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, CardBody, CardHeader, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { usePoReport } from '../../hooks/useOrders'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { formatRupiah } from '../../lib/format'
import { summarizeOrders, summarizeProducts } from '../../lib/report'

const Stat = ({ label, value, tone }) => (
  <Card className="p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`mt-1 text-xl font-bold ${tone ?? 'text-slate-900'}`}>{value}</p>
  </Card>
)

/** Laporan per PO. Figures come from server-computed order totals; cancelled orders are excluded from sales. */
export default function ReportsPage() {
  const { data: pos, loading: posLoading, error: posError, reload: reloadPos } = usePurchaseOrders()
  const [chosen, setChosen] = useState('')
  const poId = chosen || pos?.[0]?.id || null
  const { data, loading, error, reload } = usePoReport(poId)

  const summary = useMemo(() => (data ? summarizeOrders(data.orders) : null), [data])
  const rows = useMemo(() => (data ? summarizeProducts(data.items, data.orders) : []), [data])
  const cost = rows.reduce((s, r) => s + r.cost, 0)
  const profit = (summary?.revenue ?? 0) - cost

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Laporan</h2>

      {posLoading ? (
        <Skeleton className="h-11 w-full" />
      ) : posError ? (
        <Card>
          <ErrorState description={posError} onRetry={reloadPos} />
        </Card>
      ) : !pos?.length ? (
        <Card>
          <EmptyState icon={BarChart3} title="Belum ada PO" description="Laporan muncul setelah kamu membuat PO dan menerima pesanan." />
        </Card>
      ) : (
        <>
          <label className="block">
            <span className="sr-only">Pilih PO</span>
            <select
              value={poId ?? ''}
              onChange={(e) => setChosen(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
            >
              {pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <Card>
              <ErrorState description={error} onRetry={reload} />
            </Card>
          ) : summary && (summary.orders > 0 || summary.cancelled > 0) ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Pesanan aktif" value={summary.orders} />
                <Stat label="Barang terjual" value={summary.qty} />
                <Stat label="Omzet" value={formatRupiah(summary.revenue)} />
                <Stat label="Sudah dibayar" value={formatRupiah(summary.paid)} tone="text-emerald-700" />
                <Stat label="Belum dibayar" value={formatRupiah(summary.outstanding)} tone={summary.outstanding ? 'text-amber-700' : undefined} />
                <Stat label="Laba kotor" value={formatRupiah(profit)} />
              </div>
              <p className="text-xs text-slate-500">
                Laba kotor = omzet − modal (harga modal produk saat pesanan dibuat). Produk tanpa harga modal dihitung modal Rp 0.
                {summary.cancelled > 0 && ` ${summary.cancelled} pesanan dibatalkan tidak dihitung${summary.refunded ? `, dana dikembalikan ${formatRupiah(summary.refunded)}` : ''}.`}
              </p>

              <Card>
                <CardHeader title="Per produk" />
                <CardBody>
                  <ul className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <li key={r.key} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="break-words font-medium text-slate-900">{r.name}</p>
                          <p className="text-slate-500">{r.qty} barang · laba {formatRupiah(r.profit)}</p>
                        </div>
                        <p className="shrink-0 font-semibold text-slate-900">{formatRupiah(r.revenue)}</p>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </>
          ) : (
            <Card>
              <EmptyState icon={BarChart3} title="Belum ada pesanan di PO ini" description="Pilih PO lain atau tunggu pesanan masuk." />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
