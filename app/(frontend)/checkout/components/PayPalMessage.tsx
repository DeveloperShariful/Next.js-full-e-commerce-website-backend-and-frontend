'use client';

import React from 'react';
import { PayPalMessages } from '@paypal/react-paypal-js';

interface PayPalMessageProps {
  total: number;
}

export default function PayPalMessage({ total }: PayPalMessageProps) {
  if (total <= 0) return null;

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}
