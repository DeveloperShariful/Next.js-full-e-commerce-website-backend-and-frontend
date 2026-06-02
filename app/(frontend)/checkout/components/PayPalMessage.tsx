// app/(frontend)/checkout/components/PayPalMessage.tsx

'use client';
import React, { useEffect, useState } from 'react';
import { PayPalMessages } from '@paypal/react-paypal-js';

interface PayPalMessageProps { total: number; }

export default function PayPalMessage({ total }: PayPalMessageProps) {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // 🛡️ Direct Vanilla JS Polling: Checks the browser window directly every 50ms
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.paypal && window.paypal.Messages) {
        setCanRender(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (total <= 0 || !canRender) return null;

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}