jest.mock('../src/services/finanvo/finanvo.client', () => ({
  finanvoClient: {
    get: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

import { searchCompanies } from '../src/services/finanvo/company.service';
import { finanvoClient } from '../src/services/finanvo/finanvo.client';

const mockClient = finanvoClient as jest.Mocked<typeof finanvoClient>;

describe('searchCompanies', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects queries shorter than 2 characters', async () => {
    await expect(searchCompanies('X')).rejects.toThrow('VALIDATION');
  });

  it('returns empty array when API returns empty', async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] } as never);
    const results = await searchCompanies('Enercomp');
    expect(results).toHaveLength(0);
  });

  it('normalizes known company fields', async () => {
    const fakeCompany = {
      cin: 'U72502GJ2013PTC074235',
      companyName: 'ENERCOMP TECHNOLOGIES PRIVATE LIMITED',
      status: 'Active',
      category: 'Company limited by Shares',
      registeredState: 'GJ',
    };
    mockClient.get.mockResolvedValueOnce({ data: [fakeCompany] } as never);

    const results = await searchCompanies('Enercomp');
    expect(results).toHaveLength(1);
    expect(results[0].cin).toBe('U72502GJ2013PTC074235');
    expect(results[0].name).toBe('ENERCOMP TECHNOLOGIES PRIVATE LIMITED');
    expect(results[0].status).toBe('Active');
    expect(results[0].raw).toEqual(fakeCompany);
  });

  it('handles wrapped response (data.companies array)', async () => {
    const fakeCompany = { cin: 'L17110MH1973PLC019786', companyName: 'Reliance Industries' };
    mockClient.get.mockResolvedValueOnce({ data: { companies: [fakeCompany] } } as never);

    const results = await searchCompanies('Reliance');
    expect(results).toHaveLength(1);
    expect(results[0].cin).toBe('L17110MH1973PLC019786');
  });
});
