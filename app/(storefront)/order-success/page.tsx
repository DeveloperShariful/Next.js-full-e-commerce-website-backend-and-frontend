//app/(storefront)/checkout/order-success/page.tsx

import Link from 'next/link';
import { CheckCircle2, Package } from 'lucide-react';
import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import AffiliatePixelRenderer from './_components/affiliate-pixel-renderer';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.order_id as string;

  if (!orderId) {
    return notFound();
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { 
      id: true,
      orderNumber: true, 
      total: true, 
      subtotal: true,
      guestEmail: true,
      userId: true,
      referrals: { select: { affiliateId: true } }, 
      items: {
        select: { productId: true, total: true } 
      }
    }
  });

  if (!order) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-red-500">Order Not Found</h1>
            <Link href="/" className="mt-4 text-blue-600 underline">Return Home</Link>
        </div>
    );
  }

  const cookieStore = await cookies();
  const affiliateSlug = cookieStore.get("affiliate_token")?.value;
  
  let finalAffiliateId = order.referrals.length > 0 ? order.referrals[0].affiliateId : null;

  if (!finalAffiliateId && affiliateSlug) {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/internal/affiliate/process-order`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          affiliateSlug: affiliateSlug,
          totalAmount: Number(order.total),
          subtotal: Number(order.subtotal),
          items: order.items
        }),
        cache: 'no-store' 
      });

      const result = await response.json();
      if (result.success && result.affiliateId) {
        finalAffiliateId = result.affiliateId;
      }
    } catch (error) {
      console.error("Failed to process affiliate commission:", error);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
      
      {finalAffiliateId && (
        <AffiliatePixelRenderer 
          affiliateId={finalAffiliateId}
          orderTotal={Number(order.total)}
          orderId={order.id}
          currency="AUD"
        />
      )}

      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
        
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">
          Thank you for your purchase. We have received your order.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3 mb-8">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Order Number</span>
            <span className="font-medium text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Total Amount</span>
            <span className="font-medium text-gray-900">${Number(order.total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Email</span>
            <span className="font-medium text-gray-900 truncate max-w-[200px]">{order.guestEmail}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            href="/account/orders" 
            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Package size={18} />
            View Order
          </Link>
          <Link 
            href="/" 
            className="w-full py-3 bg-white text-gray-900 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}