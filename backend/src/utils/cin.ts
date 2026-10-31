/*
 * cin.ts
 * Utilities for validating, normalising, and parsing Indian Corporate Identity Numbers
 * (CINs). Used by the document controller, document service, and test suite.
 */
// CIN format: [L/U][5 digits][2-letter state][4-digit year][PLC/PTC/NPL/...][6 digits]
// Example: U72502GJ2013PTC074235  or  L17110MH1973PLC019786
const CIN_REGEX = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{2,5}\d{6}$/;

export function isValidCin(cin: string): boolean {
  return CIN_REGEX.test(cin.trim().toUpperCase());
}

export function normalizeCin(cin: string): string {
  return cin.trim().toUpperCase();
}

export function parseCin(cin: string): {
  listedStatus: 'Listed' | 'Unlisted';
  activityCode: string;
  stateCode: string;
  incorporationYear: number;
  ownershipCode: string;
  registrationNumber: string;
} | null {
  const normalized = normalizeCin(cin);
  if (!isValidCin(normalized)) return null;

  return {
    listedStatus: normalized[0] === 'L' ? 'Listed' : 'Unlisted',
    activityCode: normalized.substring(1, 6),
    stateCode: normalized.substring(6, 8),
    incorporationYear: parseInt(normalized.substring(8, 12), 10),
    ownershipCode: normalized.substring(12, normalized.length - 6),
    registrationNumber: normalized.substring(normalized.length - 6),
  };
}
