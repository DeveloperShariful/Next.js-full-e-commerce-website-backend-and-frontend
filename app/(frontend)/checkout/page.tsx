//app/(frontend)/checkout/page.tsx

import { Metadata } from 'next';
import CheckoutClient from './CheckoutClient';
import { getActivePaymentMethods } from '@/app/actions/frontend/checkout/get-payment-methods';

export const metadata: Metadata = {
  title: 'Checkout | GoBike Australia',
  description: 'Secure checkout and payment page.',
};

export default async function CheckoutPage() {
  // ১. সরাসরি ডাটাবেজ থেকে এক্টিভ পেমেন্ট গেটওয়েগুলো আনা হচ্ছে
  const paymentGateways = await getActivePaymentMethods();

  return (
    <div className="w-full md:p-8 bg-[#f8f9fa] min-h-screen">
      <div className="w-full max-w-full mx-auto relative overflow-x-hidden">
        {/* ২. ক্লায়েন্ট কম্পোনেন্টে ডাটা পাস করা হচ্ছে */}
        <CheckoutClient paymentGateways={paymentGateways} />
      </div>
    </div>
  );
}