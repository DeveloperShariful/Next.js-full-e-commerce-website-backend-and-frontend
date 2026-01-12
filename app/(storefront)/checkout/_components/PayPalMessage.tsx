//app/(storefront)/checkout/_components/PayPalMessage.tsx
'use client';
import React from 'react';
import { PayPalMessages } from '@paypal/react-paypal-js';

interface PayPalMessageProps { total: number; }

export default function PayPalMessage({ total }: PayPalMessageProps) {
  if (total <= 0) return null;
  
  return (
    <div className="mb-4 text-center">
      <PayPalMessages 
        style={{ layout: 'text', text: { align: 'center' } }}
        forceReRender={[{ amount: total }]} 
      />
    </div>
  );
}