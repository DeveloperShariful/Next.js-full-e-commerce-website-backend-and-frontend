// app/(frontend)/checkout/page.tsx

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { db } from '@/lib/prisma';
import CheckoutClient from './CheckoutClient';
import { getActivePaymentMethods } from '@/app/actions/frontend/checkout/get-payment-methods';

export default async function CheckoutPage() {
  // Run cookies() and auth() in parallel — both are independent
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const sessionId = cookieStore.get('cart_session')?.value;

  // Resolve userId, payment methods, and store settings in parallel
  const [userId, paymentGateways, storeSettings] = await Promise.all([
    session?.user?.email
      ? db.user.findUnique({ where: { email: session.user.email }, select: { id: true } }).then(u => u?.id ?? null)
      : Promise.resolve(null),
    getActivePaymentMethods(),
    db.storeSettings.findUnique({ where: { id: "settings" }, select: { generalConfig: true } }),
  ]);

  const generalConfig = storeSettings?.generalConfig as { enableCoupons?: boolean } | null;
  const enableCoupons = generalConfig?.enableCoupons !== false;

  if (sessionId || userId) {
    const cart = await db.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      select: { items: { select: { id: true } } },
    });

    if (!cart || cart.items.length === 0) {
      redirect('/cart');
    }
  } else {
    redirect('/cart');
  }

  return (
    <div className="w-full md:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-full mx-auto relative overflow-x-hidden">
        <CheckoutClient paymentGateways={paymentGateways} enableCoupons={enableCoupons} />
      </div>
    </div>
  );
}
