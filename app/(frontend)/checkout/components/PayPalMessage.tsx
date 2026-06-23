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

function PayPalMessageInner({ total }: { total: number }) {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  if (isPending || isRejected) return null;
  if (!isResolved) return null;
  if (
    typeof window !== 'undefined' &&
    !(window as { paypal?: { Messages?: unknown } }).paypal?.Messages
  ) {
    return null;
  }

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}

interface PayPalMessageProps {
  total: number;
  clientId: string;
}

// Deferred 3 seconds after mount so it never blocks checkout page load.
// Uses the outer PayPalScriptProvider — no inner provider needed.
export default function PayPalMessage({ total, clientId }: PayPalMessageProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show || total <= 0 || !clientId) return null;

  return (
    <PayPalMessageErrorBoundary>
      <PayPalMessageInner total={total} />
    </PayPalMessageErrorBoundary>
  );
}
