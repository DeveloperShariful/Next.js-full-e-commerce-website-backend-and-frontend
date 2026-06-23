'use client';

import React, { useState, useEffect } from 'react';
import { usePayPalScriptReducer, PayPalMessages } from '@paypal/react-paypal-js';

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

function PayPalMessageInner({ debouncedTotal }: { debouncedTotal: number }) {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  if (isPending || isRejected || !isResolved) return null;
  if (
    typeof window !== 'undefined' &&
    !(window as { paypal?: { Messages?: unknown } }).paypal?.Messages
  ) {
    return null;
  }

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages
        amount={debouncedTotal}
        forceReRender={[debouncedTotal]}
      />
    </div>
  );
}

interface PayPalMessageProps {
  total: number;
  clientId: string;
}

export default function PayPalMessage({ total, clientId }: PayPalMessageProps) {
  // Delay initial render by 5 seconds — never blocks page or PayPal button load
  const [show, setShow] = useState(false);

  // Debounced total — message only re-renders 1.5s after coupon/shipping stops changing
  const [debouncedTotal, setDebouncedTotal] = useState(total);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTotal(total), 1500);
    return () => clearTimeout(timer);
  }, [total]);

  if (!show || total <= 0 || !clientId) return null;

  return (
    <PayPalMessageErrorBoundary>
      <PayPalMessageInner debouncedTotal={debouncedTotal} />
    </PayPalMessageErrorBoundary>
  );
}
