import type { QueueItem } from '../types';

const STATUS_ICONS: Record<QueueItem['status'], string> = {
  pending: '⏳',
  downloading: '⬇️',
  completed: '✅',
  failed: '❌',
};

interface Props {
  items: QueueItem[];
  emptyMessage?: string;
}

export default function DownloadList({ items, emptyMessage }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">⬇️</div>
        <div>{emptyMessage ?? 'No downloads yet.'}</div>
      </div>
    );
  }

  return (
    <div>
      {items.map(item => (
        <div className="dl-item" key={item.id}>
          <span style={{ fontSize: '1.1rem' }}>{STATUS_ICONS[item.status]}</span>
          <div className="dl-info">
            <div className="dl-name">{item.fileName ?? item.documentId}</div>
            {item.error && <div className="text-danger text-sm">{item.error}</div>}
            {item.status === 'completed' && item.filePath && (
              <div className="text-dim text-sm">{item.filePath}</div>
            )}
          </div>
          <span className={`badge ${
            item.status === 'completed' ? 'badge-active' :
            item.status === 'failed' ? 'badge-inactive' :
            item.status === 'downloading' ? 'badge-missing' : 'badge-pending'
          }`}>
            {item.status}
          </span>
          {item.retries > 0 && (
            <span className="text-dim text-sm">retry {item.retries}</span>
          )}
        </div>
      ))}
    </div>
  );
}
