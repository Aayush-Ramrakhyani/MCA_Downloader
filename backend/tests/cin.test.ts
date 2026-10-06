import { isValidCin, normalizeCin, parseCin } from '../src/utils/cin';

describe('CIN validation', () => {
  it('accepts valid listed CIN', () => {
    expect(isValidCin('L17110MH1973PLC019786')).toBe(true);
  });

  it('accepts valid unlisted CIN', () => {
    expect(isValidCin('U72502GJ2013PTC074235')).toBe(true);
  });

  it('normalizes to uppercase', () => {
    expect(normalizeCin('l17110mh1973plc019786')).toBe('L17110MH1973PLC019786');
  });

  it('rejects too-short CIN', () => {
    expect(isValidCin('L1711')).toBe(false);
  });

  it('rejects CIN with invalid first char', () => {
    expect(isValidCin('X17110MH1973PLC019786')).toBe(false);
  });

  it('parses a valid CIN correctly', () => {
    const parsed = parseCin('L17110MH1973PLC019786');
    expect(parsed).not.toBeNull();
    expect(parsed!.listedStatus).toBe('Listed');
    expect(parsed!.stateCode).toBe('MH');
    expect(parsed!.incorporationYear).toBe(1973);
  });

  it('returns null for invalid CIN', () => {
    expect(parseCin('INVALID')).toBeNull();
  });
});
