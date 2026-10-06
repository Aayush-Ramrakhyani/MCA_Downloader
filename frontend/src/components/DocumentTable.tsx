import type { Document } from '../types';

interface Props {
  documents: Document[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function DocumentTable({ documents, selectedIds, onToggle, onSelectAll, onClearAll }: Props) {
  const allSelected = documents.length > 0 && documents.every(d => selectedIds.has(d.id));
  const someSelected = documents.some(d => selectedIds.has(d.id));

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📄</div>
        <div>No documents match the current filters.</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button className="btn btn-sm btn-secondary" onClick={allSelected ? onClearAll : onSelectAll}>
          {allSelected ? 'Deselect all' : 'Select all filtered'}
        </button>
        {someSelected && !allSelected && (
          <button className="btn btn-sm btn-ghost" onClick={onClearAll}>Clear selection</button>
        )}
        {selectedIds.size > 0 && (
          <span className="text-dim text-sm" style={{ alignSelf: 'center' }}>
            {selectedIds.size} selected
          </span>
        )}
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => allSelected ? onClearAll() : onSelectAll()}
                />
              </th>
              <th>Document Name</th>
              <th>Form ID</th>
              <th>Year</th>
              <th>Category</th>
              <th>Filing Date</th>
              <th>SRN</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id} onClick={() => onToggle(doc.id)} style={{ cursor: 'pointer' }}>
                <td onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(doc.id)}
                    onChange={() => onToggle(doc.id)}
                  />
                </td>
                <td>
                  <div className="td-truncate" title={doc.name}>{doc.name}</div>
                  {doc.description && (
                    <div className="text-dim text-sm td-truncate" title={doc.description}>
                      {doc.description}
                    </div>
                  )}
                </td>
                <td><span className="mono">{doc.formId ?? '—'}</span></td>
                <td>{doc.year ?? '—'}</td>
                <td>{doc.category ?? '—'}</td>
                <td className="text-dim">{doc.filingDate ?? '—'}</td>
                <td><span className="mono text-dim">{doc.srn ?? '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
