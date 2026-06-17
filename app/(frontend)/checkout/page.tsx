// app/(frontend)/checkout/page.tsx

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { db } from '@/lib/prisma';
import CheckoutClient from './CheckoutClient';
import { getActivePaymentMethods } from '@/app/actions/frontend/checkout/get-payment-methods';

export default async function CheckoutPage() {
  // Server-side empty cart check — prevents flash redirect on client
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('cart_session')?.value;

  const session = await auth();
  const userId = session?.user?.email
    ? (await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
    : null;

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

  const paymentGateways = await getActivePaymentMethods();

  return (
    <div className="w-full md:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-full mx-auto relative overflow-x-hidden">
        <CheckoutClient paymentGateways={paymentGateways} />
      </div>
    </div>
  );
}
