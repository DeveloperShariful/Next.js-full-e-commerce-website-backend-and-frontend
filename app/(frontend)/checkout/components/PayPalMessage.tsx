'use client';

import React from 'react';
import { PayPalMessages, usePayPalScriptReducer } from '@paypal/react-paypal-js';

// Error boundary silently catches any crash from PayPalMessages
// (e.g. window.paypal.Messages undefined when Pay Later is unsupported)
class PayPalMessageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function PayPalMessageInner({ total }: { total: number }) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();

  // Wait until PayPal SDK is fully loaded
  if (!isResolved || isRejected) return null;

  // Messages component may be absent if merchant account doesn't support Pay Later
  if (typeof window === 'undefined' || !(window as { paypal?: { Messages?: unknown } }).paypal?.Messages) return null;

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}

export default function PayPalMessage({ total }: { total: number }) {
  if (total <= 0) return null;
  return (
    <PayPalMessageErrorBoundary>
      <PayPalMessageInner total={total} />
    </PayPalMessageErrorBoundary>
  );
}
