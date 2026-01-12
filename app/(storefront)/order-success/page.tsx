//app/(storefront)/checkout/order-success/page.tsx

import Link from 'next/link';
import { CheckCircle2, Package } from 'lucide-react';
import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.order_id as string;

  if (!orderId) {
    return notFound();
  }

  // Fetch Order Details
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, total: true, guestEmail: true }
  });

  if (!order) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold text-red-500">Order Not Found</h1>
            <Link href="/" className="mt-4 text-blue-600 underline">Return Home</Link>
        </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50">
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
            <span className="font-medium text-gray-900">${order.total.toFixed(2)}</span>
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