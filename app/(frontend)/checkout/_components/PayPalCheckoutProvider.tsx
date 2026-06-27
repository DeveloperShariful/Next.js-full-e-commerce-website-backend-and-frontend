'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useMemo } from 'react';

interface Props {
  clientId: string | null;
  children: React.ReactNode;
}

export default function PayPalCheckoutProvider({ clientId, children }: Props) {
  const options = useMemo(() => ({
    clientId: clientId ?? 'test',
    currency: 'AUD',
    intent: 'capture',
    components: 'buttons',
  }), [clientId]);

  // PayPal configure না থাকলে provider skip করো
  if (!clientId) {
    return <>{children}</>;
  }

  return (
    // deferLoading={false} → layout mount হওয়া মাত্রই SDK load শুরু হয়,
    // PayPalButtons render হওয়ার আগেই। Race condition দূর হয়।
    <PayPalScriptProvider options={options} deferLoading={false}>
      {children}
    </PayPalScriptProvider>
  );
}
