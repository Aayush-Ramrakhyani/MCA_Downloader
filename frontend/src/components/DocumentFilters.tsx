import type { DocumentFilters } from '../hooks/useDocuments';

interface Props {
  filters: DocumentFilters;
  onChange: (f: DocumentFilters) => void;
  categories: string[];
  formIds: string[];
  years: number[];
  totalCount: number;
  filteredCount: number;
}

export default function DocumentFiltersBar({
  filters, onChange, categories, formIds, years, totalCount, filteredCount,
}: Props) {
  const set = (k: keyof DocumentFilters, v: string) => onChange({ ...filters, [k]: v });

  return (
    <div className="filters-bar">
      <input
        className="input"
        placeholder="Search documents…"
        value={filters.search}
        onChange={e => set('search', e.target.value)}
        style={{ minWidth: 220 }}
      />
      <select className="select" value={filters.category} onChange={e => set('category', e.target.value)}>
        <option value="">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select className="select" value={filters.formId} onChange={e => set('formId', e.target.value)}>
        <option value="">All Form IDs</option>
        {formIds.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <select className="select" value={filters.year} onChange={e => set('year', e.target.value)}>
        <option value="">All Years</option>
        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
      <span className="text-dim text-sm" style={{ marginLeft: 'auto' }}>
        {filteredCount !== totalCount ? `${filteredCount} / ${totalCount}` : `${totalCount}`} docs
      </span>
      {(filters.search || filters.category || filters.formId || filters.year) && (
        <button className="btn btn-ghost btn-sm" onClick={() => onChange({ search: '', category: '', formId: '', year: '' })}>
          Clear
        </button>
      )}
    </div>
  );
}
