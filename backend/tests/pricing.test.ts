/*
 * pricing.test.ts
 * Unit tests for the order pricing calculation: slab rounding, GST calculation,
 * credit application, and credit cap enforcement.
 */
import { calculateOrder, getPricingConfig } from '../src/services/pricing.service';

describe('calculateOrder', () => {
  it('calculates sub-total at ₹145 per 100 docs', () => {
    const result = calculateOrder({
      cin: 'U72502GJ2013PTC074235',
      companyName: 'Test Corp',
      selectedDocCount: 100,
      availableCredits: 0,
    });
    expect(result.subTotal).toBe(145);
  });

  it('rounds up to the next slab when count < 100', () => {
    const result = calculateOrder({
      cin: 'U72502GJ2013PTC074235',
      companyName: 'Test Corp',
      selectedDocCount: 1,
      availableCredits: 0,
    });
    expect(result.subTotal).toBe(145);
  });

  it('charges two slabs for 101 docs', () => {
    const result = calculateOrder({
      cin: 'U72502GJ2013PTC074235',
      companyName: null,
      selectedDocCount: 101,
      availableCredits: 0,
    });
    expect(result.subTotal).toBe(290);
  });

  it('applies available credits correctly', () => {
    const result = calculateOrder({
      cin: 'U72502GJ2013PTC074235',
      companyName: null,
      selectedDocCount: 100,
      availableCredits: 50,
    });
    expect(result.creditsApplied).toBe(50);
    expect(result.amountDue).toBe(result.totalAmount - 50);
  });

  it('does not over-apply credits', () => {
    const result = calculateOrder({
      cin: 'U72502GJ2013PTC074235',
      companyName: null,
      selectedDocCount: 100,
      availableCredits: 99999,
    });
    expect(result.creditsApplied).toBe(result.totalAmount);
    expect(result.amountDue).toBe(0);
  });

  it('calculates 18% GST', () => {
    const result = calculateOrder({
      cin: 'U72502GJ2013PTC074235',
      companyName: null,
      selectedDocCount: 100,
      availableCredits: 0,
    });
    expect(result.gstAmount).toBe(Math.round((145 * 18) / 100));
  });
});
