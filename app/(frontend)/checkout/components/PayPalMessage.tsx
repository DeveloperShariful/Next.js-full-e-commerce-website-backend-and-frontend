// app/(frontend)/checkout/components/PayPalMessage.tsx

'use client';
import React, { useEffect, useState } from 'react';
import { PayPalMessages, usePayPalScriptReducer } from '@paypal/react-paypal-js';

interface PayPalMessageProps { total: number; }

export default function PayPalMessage({ total }: PayPalMessageProps) {
  const [{ isResolved, options }] = usePayPalScriptReducer();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // 🛡️ Security Check: Only render if PayPal script is fully loaded AND Messages component exists in window
    if (isResolved && window.paypal && window.paypal.Messages) {
      setCanRender(true);
    } else {
      setCanRender(false);
    }
  }, [isResolved, options]);

  if (total <= 0 || !canRender) return null;

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}