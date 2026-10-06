import { useState, useMemo } from 'react';
import type { Document } from '../types';

export interface DocumentFilters {
  search: string;
  category: string;
  formId: string;
  year: string;
}

export function useDocuments(documents: Document[]) {
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    category: '',
    formId: '',
    year: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats = new Set<string>();
    documents.forEach(d => { if (d.category) cats.add(d.category); });
    return Array.from(cats).sort();
  }, [documents]);

  const formIds = useMemo(() => {
    const ids = new Set<string>();
    documents.forEach(d => { if (d.formId) ids.add(d.formId); });
    return Array.from(ids).sort();
  }, [documents]);

  const years = useMemo(() => {
    const yrs = new Set<number>();
    documents.forEach(d => { if (d.year) yrs.add(d.year); });
    return Array.from(yrs).sort((a, b) => b - a);
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter(doc => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          doc.name.toLowerCase().includes(q) ||
          (doc.formId?.toLowerCase().includes(q) ?? false) ||
          (doc.description?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }
      if (filters.category && doc.category !== filters.category) return false;
      if (filters.formId && doc.formId !== filters.formId) return false;
      if (filters.year && doc.year !== parseInt(filters.year, 10)) return false;
      return true;
    });
  }, [documents, filters]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(d => d.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const selectedDocuments = useMemo(
    () => documents.filter(d => selectedIds.has(d.id)),
    [documents, selectedIds],
  );

  return {
    filters,
    setFilters,
    filtered,
    categories,
    formIds,
    years,
    selectedIds,
    toggleSelect,
    selectAll,
    clearAll,
    selectedDocuments,
  };
}
