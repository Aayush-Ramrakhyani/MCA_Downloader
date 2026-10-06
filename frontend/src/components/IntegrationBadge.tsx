import type { IntegrationStatus } from '../types';

const STATUS_CONFIG: Record<IntegrationStatus, { label: string; cls: string }> = {
  IMPLEMENTED:           { label: 'Implemented',  cls: 'badge-implemented' },
  PARTIALLY_IMPLEMENTED: { label: 'Partial',       cls: 'badge-partial' },
  MISSING_API:           { label: 'Missing API',   cls: 'badge-missing' },
  REQUIRES_AUTHORIZATION:{ label: 'Needs Auth',    cls: 'badge-pending' },
  REQUIRES_PAYMENT:      { label: 'Needs Payment', cls: 'badge-pending' },
};

export default function IntegrationBadge({ status }: { status: IntegrationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'badge-pending' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}
