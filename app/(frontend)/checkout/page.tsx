// app/(frontend)/checkout/page.tsx

import CheckoutClient from './CheckoutClient';
import { getActivePaymentMethods } from '@/app/actions/frontend/checkout/get-payment-methods';

// ==========================================
// ENTERPRISE CHECKOUT PAGE
// No WooCommerce API - Fully Prisma Driven
// ==========================================

export default async function CheckoutPage() {
  
  // 🛡️ Fetching dynamic payment gateways straight from your Prisma DB
  // This action ensures sensitive keys are stripped out before hitting the client
  const paymentGateways = await getActivePaymentMethods();

  return (
    <div className="w-full md:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-full mx-auto relative overflow-x-hidden">
        <CheckoutClient paymentGateways={paymentGateways} />
      </div>
    </div>
  );
}