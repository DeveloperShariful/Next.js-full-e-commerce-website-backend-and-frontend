// app/(frontend)/checkout/components/PayPalMessage.tsx

'use client';

import React from 'react';
import { PayPalMessages, usePayPalScriptReducer } from '@paypal/react-paypal-js';

interface PayPalMessageProps {
  total: number;
}

// ✅ FIX: আগে setInterval দিয়ে window.paypal.Messages poll করত।
// এখন usePayPalScriptReducer hook ব্যবহার করছি — SDK context থেকে
// সরাসরি loading state পাচ্ছি, কোনো polling loop নেই।
export default function PayPalMessage({ total }: PayPalMessageProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  // SDK loading বা failed হলে কিছু show করব না
  if (total <= 0 || isPending || isRejected) return null;

  return (
    <div className="mb-4 text-center pl-2.5">
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}
