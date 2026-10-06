import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { companiesApi } from '../services/api';
import CompanyCard from '../components/CompanyCard';
import type { Company } from '../types';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      setError('Enter at least 2 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await companiesApi.search(query.trim());
      setResults(res.data.data?.companies ?? []);
      setSearched(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Search failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: Company) => {
    navigate(`/documents/${company.cin}`, { state: { company } });
  };

  return (
    <div className="page">
      <h2 style={{ marginBottom: 20 }}>Search Indian Companies</h2>

      <form onSubmit={handleSearch} className="search-wrapper" style={{ maxWidth: 600 }}>
        <input
          className="input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter company name…"
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Search'}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-16">{error}</div>}

      {searched && !loading && (
        <div className="mt-24">
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <div>No companies found for "{query}"</div>
            </div>
          ) : (
            <>
              <div className="text-dim text-sm mb-16">{results.length} result{results.length !== 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.map(c => (
                  <CompanyCard
                    key={c.cin}
                    company={c}
                    selected={false}
                    onClick={() => handleSelect(c)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className="mt-24 text-dim">
          <p>Search for a company by name to browse its available MCA documents.</p>
          <p className="mt-8">Examples: <code>Reliance</code>, <code>Enercomp</code>, <code>Infosys</code></p>
        </div>
      )}
    </div>
  );
}
