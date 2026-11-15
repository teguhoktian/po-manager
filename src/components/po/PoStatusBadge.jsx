import { Badge } from '../ui'
import { PO_STATUS_META } from '../../lib/poStatus'

export function PoStatusBadge({ status }) {
  const meta = PO_STATUS_META[status] ?? { label: status, tone: 'neutral' }
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}
