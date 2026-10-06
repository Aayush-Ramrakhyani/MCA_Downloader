/**
 * Pricing service.
 *
 * The live UI shows: ₹145 / 100 Docs / Company
 * These values come from configuration, NOT hardcoded constants.
 * If the API returns pricing data, update getPricingConfig() to use it.
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

  const subTotal = Math.ceil(selectedDocCount / 100) * pricing.ratePerHundredDocs;
  const gstAmount = Math.round((subTotal * pricing.gstPercent) / 100);
  const totalAmount = subTotal + gstAmount;
  const creditsApplied = Math.min(availableCredits, totalAmount);
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
