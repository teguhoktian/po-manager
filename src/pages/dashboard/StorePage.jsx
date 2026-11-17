import { Card, CardBody, ErrorState, Skeleton } from '../../components/ui'
import { StoreCreateForm } from '../../components/store/StoreCreateForm'
import { StoreProfileForm } from '../../components/store/StoreProfileForm'
import { StoreSlugForm } from '../../components/store/StoreSlugForm'
import { StoreLogoUploader } from '../../components/store/StoreLogoUploader'
import { StoreLinkCard } from '../../components/store/StoreLinkCard'
import { useStore } from '../../hooks/useStore'

function StoreSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardBody className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

export default function StorePage() {
  const { store, loading, error, reload } = useStore()

  if (loading) return <StoreSkeleton />
  if (error) return <ErrorState description={error} onRetry={reload} />
  if (!store) return <div className="mx-auto max-w-xl"><StoreCreateForm onCreated={reload} /></div>

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <StoreLogoUploader store={store} onUploaded={reload} />
        <StoreProfileForm key={store.updatedAt?.seconds ?? 'p'} store={store} onSaved={reload} />
      </div>
      <div className="space-y-4">
        <StoreLinkCard store={store} />
        <StoreSlugForm key={store.slug} store={store} onChanged={reload} />
      </div>
    </div>
  )
}
