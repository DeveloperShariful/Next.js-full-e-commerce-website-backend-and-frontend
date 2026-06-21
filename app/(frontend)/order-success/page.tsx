// app/(frontend)/order-success/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface AddressData {
  firstName?: string;
  lastName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postcode?: string;
  phone?: string;
}

function formatCurrency(amount: { toString(): string } | number | string) {
  return `$${parseFloat(String(amount)).toFixed(2)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

const NEXT_STEPS = [
  { emoji: '✅', title: 'Order Confirmed', desc: "We've received your order and payment.", done: true },
  { emoji: '📋', title: 'Processing', desc: 'Your order is now being processed and packed.', done: false },
  { emoji: '📦', title: 'Shipped', desc: "Tracking number emailed once dispatched.", done: false },
  { emoji: '🏠', title: 'Delivered', desc: 'Enjoy your GoBike gear!', done: false },
];

export default async function OrderSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId = params.order_id as string;

  if (!orderId) return notFound();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      orderDate: true,
      total: true,
      subtotal: true,
      shippingTotal: true,
      discountTotal: true,
      guestEmail: true,
      userId: true,
      shippingAddress: true,
      billingAddress: true,
      shippingMethod: true,
      affiliateId: true,
      referrals: { select: { affiliateId: true } },
      items: {
        select: {
          productName: true,
          variantName: true,
          quantity: true,
          price: true,
          total: true,
          image: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-500">Order Not Found</h1>
        <Link href="/" className="mt-4 text-blue-600 underline">Return Home</Link>
      </div>
    );
  }

  // Affiliate tracking — fallback if not yet processed by capture webhook
  let finalAffiliateId = order.referrals.length > 0 ? order.referrals[0].affiliateId : null;

  if (!finalAffiliateId && order.affiliateId) {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/affiliate/process-order`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.INTERNAL_API_KEY || '',
        },
        body: JSON.stringify({ orderId: order.id }),
        cache: 'no-store',
      });
      const result = await response.json();
      if (result.success) finalAffiliateId = order.affiliateId;
    } catch (error) {
      console.error('Failed to process affiliate commission:', error);
    }
  }

  const shipping = order.shippingAddress as AddressData;
  const billing = order.billingAddress as AddressData;

  const shippingLine = [shipping?.city, shipping?.state, shipping?.postcode].filter(Boolean).join(', ');
  const billingLine = [billing?.city, billing?.state, billing?.postcode].filter(Boolean).join(', ');

  return (
    <div className="min-h-[80vh] bg-gray-50 py-6 px-4">


      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Hero (full width) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Order Confirmed!</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Confirmation sent to <span className="font-semibold text-gray-800">{order.guestEmail}</span>
            </p>
          </div>
          <div className="sm:ml-auto flex flex-wrap gap-2 justify-center sm:justify-end">
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-bold text-gray-800">
              #{order.orderNumber}
            </span>
            <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600">
              {formatDate(order.orderDate)}
            </span>
          </div>
        </div>

        {/* ── Items + Totals (full width) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-sm">Items Ordered</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3 px-5 py-3.5">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    width={52}
                    height={52}
                    className="w-13 h-13 rounded-lg object-cover bg-gray-100 shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-13 h-13 min-w-[52px] min-h-[52px] bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(item.total)}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.price)} ea</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.shippingTotal) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  Shipping
                  {order.shippingMethod && (
                    <span className="text-xs text-gray-400 ml-1">({order.shippingMethod})</span>
                  )}
                </span>
                <span>{formatCurrency(order.shippingTotal)}</span>
              </div>
            )}
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-sm text-green-700 font-medium">
                <span>Discount</span>
                <span>−{formatCurrency(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Total (AUD)</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Shipping + Billing — পাশাপাশি desktop-এ, mobile-এ উপর-নিচ ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shipping Address</h3>
            </div>
            <div className="text-sm text-gray-700 space-y-0.5 leading-relaxed">
              <p className="font-semibold text-gray-900">
                {[shipping?.firstName, shipping?.lastName].filter(Boolean).join(' ')}
              </p>
              {shipping?.address1 && <p>{shipping.address1}</p>}
              {shippingLine && <p>{shippingLine}</p>}
              <p>Australia</p>
              {shipping?.phone && (
                <p className="text-gray-400 text-xs pt-1">{shipping.phone}</p>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Billing Address</h3>
            </div>
            <div className="text-sm text-gray-700 space-y-0.5 leading-relaxed">
              <p className="font-semibold text-gray-900">
                {[billing?.firstName, billing?.lastName].filter(Boolean).join(' ')}
              </p>
              {billing?.address1 && <p>{billing.address1}</p>}
              {billingLine && <p>{billingLine}</p>}
              <p>Australia</p>
            </div>
          </div>
        </div>

        {/* ── What Happens Next (full width) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">What Happens Next</h3>
          <div className="relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gray-100" />
            <div className="space-y-4">
              {NEXT_STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 relative z-10 border ${
                    s.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}>
                    {s.emoji}
                  </div>
                  <div className="pt-0.5">
                    <p className={`font-semibold text-sm ${s.done ? 'text-green-700' : 'text-gray-800'}`}>
                      {s.title}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA Buttons (full width) ── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <Link
            href="/my-account?tab=orders"
            className="flex-1 py-3.5 bg-[#1a1a1a] text-white font-bold rounded-xl hover:bg-[#333] transition-colors text-center text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View My Order
          </Link>
          <Link
            href="/"
            className="flex-1 py-3.5 bg-white text-gray-800 border border-gray-200 font-bold rounded-xl hover:bg-gray-50 transition-colors text-center text-sm"
          >
            ← Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
