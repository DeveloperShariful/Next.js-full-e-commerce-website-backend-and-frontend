// app/order-confirmation/page.tsx

import { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient'; 

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            {/* Tailwind Spinner */}
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#333] rounded-full animate-spin mb-6"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Loading Confirmation...</h1>
        </div>
    }>
      <OrderConfirmationClient />
    </Suspense>
  );
}