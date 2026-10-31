/*
 * document.test.ts
 * Unit tests for the document service: CIN validation, response normalisation, and
 * handling of wrapped response shapes. Uses a mocked Finanvo client — no live API calls.
 */
import { isValidCin } from '../src/utils/cin';

// Mock the finanvoClient before importing the service (Jest hoists this above imports)
jest.mock('../src/services/finanvo/finanvo.client', () => ({
  finanvoClient: {
    get: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

import { getCompanyDocuments } from '../src/services/finanvo/document.service';
import { finanvoClient } from '../src/services/finanvo/finanvo.client';

const mockClient = finanvoClient as jest.Mocked<typeof finanvoClient>;

describe('getCompanyDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an invalid CIN', async () => {
    await expect(getCompanyDocuments('INVALID')).rejects.toThrow('VALIDATION');
  });

  it('returns empty documents when API returns empty array', async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] } as never);
    const result = await getCompanyDocuments('U72502GJ2013PTC074235');
    expect(result.totalCount).toBe(0);
    expect(result.documents).toHaveLength(0);
  });

  it('normalizes document fields from a known shape', async () => {
    const fakeDoc = {
      id: 'doc-1',
      formId: 'MGT-7',
      documentName: 'Annual Return 2023',
      description: 'Annual return filing',
      category: 'Annual Reports',
      year: 2023,
      filingDate: '2023-10-15',
      fileName: 'MGT7_2023.pdf',
      srn: 'G12345678',
    };
    mockClient.get.mockResolvedValueOnce({ data: [fakeDoc] } as never);

    const result = await getCompanyDocuments('U72502GJ2013PTC074235');
    expect(result.totalCount).toBe(1);
    const doc = result.documents[0];
    expect(doc.id).toBe('doc-1');
    expect(doc.name).toBe('Annual Return 2023');
    expect(doc.year).toBe(2023);
    expect(doc.raw).toEqual(fakeDoc);
  });

  it('handles wrapped response (data.documents array)', async () => {
    const fakeDoc = { id: 'doc-2', documentName: 'Balance Sheet' };
    mockClient.get.mockResolvedValueOnce({ data: { documents: [fakeDoc] } } as never);

    const result = await getCompanyDocuments('L17110MH1973PLC019786');
    expect(result.totalCount).toBe(1);
  });
});
