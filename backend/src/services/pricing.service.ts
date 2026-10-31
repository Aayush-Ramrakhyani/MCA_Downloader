/*
 * pricing.service.ts
 * Calculates order totals (sub-total, GST, credits applied) based on the current
 * pricing config. Defaults to ₹145 / 100 docs / company at 18% GST; can be
 * overridden at runtime if the Finanvo API returns live pricing data.
 */

export interface PricingConfig {
  currency: string;
  ratePerHundredDocs: number;
  gstPercent: number;
  minOrderDocs: number;
}

export interface OrderCalculation {
  cin: string;
  companyName: string | null;
  selectedDocCount: number;
  rateDescription: string;
  subTotal: number;
  gstAmount: number;
  totalAmount: number;
  currency: string;
  creditsApplied: number;
  amountDue: number;
}

const DEFAULT_PRICING: PricingConfig = {
  currency: 'INR',
  ratePerHundredDocs: 145,
  gstPercent: 18,
  minOrderDocs: 1,
};

let runtimePricing: PricingConfig | null = null;

/**
 * Call this if the Finanvo API returns pricing data in a response.
 * Allows the UI to stay in sync with the API's actual rates.
 */
export function updatePricingFromApi(pricing: Partial<PricingConfig>): void {
  runtimePricing = { ...DEFAULT_PRICING, ...pricing };
}

export function getPricingConfig(): PricingConfig {
  return runtimePricing ?? DEFAULT_PRICING;
}

export function calculateOrder(opts: {
  cin: string;
  companyName: string | null;
  selectedDocCount: number;
  availableCredits: number;
}): OrderCalculation {
  const pricing = getPricingConfig();
  const { cin, companyName, selectedDocCount, availableCredits } = opts;

  const subTotal = Math.ceil(selectedDocCount / 100) * pricing.ratePerHundredDocs; // always round up to the next 100-doc slab
  const gstAmount = Math.round((subTotal * pricing.gstPercent) / 100);
  const totalAmount = subTotal + gstAmount;
  const creditsApplied = Math.min(availableCredits, totalAmount); // credits cannot exceed the order total
  const amountDue = totalAmount - creditsApplied;

  return {
    cin,
    companyName,
    selectedDocCount,
    rateDescription: `₹${pricing.ratePerHundredDocs} / 100 Docs / Company`,
    subTotal,
    gstAmount,
    totalAmount,
    currency: pricing.currency,
    creditsApplied,
    amountDue,
  };
}
