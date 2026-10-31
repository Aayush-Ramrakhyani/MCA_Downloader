/*
 * CompanyCard.tsx
 * Displays a single company search result with its name, CIN, status badge,
 * registered state, class, and incorporation date. Clickable to navigate to documents.
 */
import type { Company } from '../types';

interface Props {
  company: Company;
  selected: boolean;
  onClick: () => void;
}

export default function CompanyCard({ company, selected, onClick }: Props) {
  return (
    <div className={`company-card ${selected ? 'selected' : ''}`} onClick={onClick} role="button" tabIndex={0}>
      <div className="company-name">{company.name}</div>
      <div className="company-cin mono">{company.cin}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {company.status && (
          <span className={`badge ${company.status.toLowerCase().includes('active') ? 'badge-active' : 'badge-inactive'}`}>
            {company.status}
          </span>
        )}
        {company.registeredState && (
          <span className="badge badge-missing">{company.registeredState}</span>
        )}
        {company.classOfCompany && (
          <span className="text-dim text-sm">{company.classOfCompany}</span>
        )}
      </div>
      {company.dateOfIncorporation && (
        <div className="text-dim text-sm mt-8">Inc. {company.dateOfIncorporation}</div>
      )}
    </div>
  );
}
