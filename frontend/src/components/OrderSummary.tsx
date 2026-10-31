/*
 * OrderSummary.tsx
 * Displays a line-item order breakdown (sub-total, GST, credits applied, total due)
 * and a Place Order button. Shows a warning banner when the order API is not yet
 * configured (MISSING_API status).
 */
import type { OrderCalculation } from '../types';

interface Props {
  calc: OrderCalculation;
  onConfirm?: () => void;
  loading?: boolean;
  disabled?: boolean;
  missingApi?: boolean;
}

export default function OrderSummary({ calc, onConfirm, loading, disabled, missingApi }: Props) {
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="card">
      <div className="card-title">Order Summary</div>
      <div className="order-row">
        <span className="text-dim">Company / CIN</span>
        <span className="mono text-sm">{calc.cin}</span>
      </div>
      {calc.companyName && (
        <div className="order-row">
          <span className="text-dim">Company Name</span>
          <span>{calc.companyName}</span>
        </div>
      )}
      <div className="order-row">
        <span className="text-dim">Documents Selected</span>
        <span>{calc.selectedDocCount}</span>
      </div>
      <div className="order-row">
        <span className="text-dim">Rate</span>
        <span className="text-sm">{calc.rateDescription}</span>
      </div>
      <hr className="divider" />
      <div className="order-row">
        <span className="text-dim">Sub-total</span>
        <span>{fmt(calc.subTotal)}</span>
      </div>
      <div className="order-row">
        <span className="text-dim">GST (18%)</span>
        <span>{fmt(calc.gstAmount)}</span>
      </div>
      {calc.creditsApplied > 0 && (
        <div className="order-row">
          <span className="text-success">Credits Applied</span>
          <span className="text-success">-{fmt(calc.creditsApplied)}</span>
        </div>
      )}
      <div className="order-row">
        <span style={{ fontWeight: 600 }}>Total Due</span>
        <span className="order-total">{fmt(calc.amountDue)}</span>
      </div>

      {missingApi && (
        <div className="alert alert-warn mt-16">
          <strong>Order placement is not yet configured.</strong><br />
          The <code>saveCinDinPayment</code> API endpoint has not been captured from DevTools.
          Capture the request and implement <code>order.service.ts</code> to enable this.
        </div>
      )}

      {onConfirm && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 16 }}
          onClick={onConfirm}
          disabled={disabled || loading || missingApi}
        >
          {loading ? <><span className="spinner" />Processing…</> : 'Place Order'}
        </button>
      )}
    </div>
  );
}
