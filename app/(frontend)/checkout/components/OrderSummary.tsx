// app/(frontend)/checkout/components/OrderSummary.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

// ============================================================================
// 1. INTERFACES
// ============================================================================
export interface CartItemAttribute {
  id?: string;
  name: string;
  value: string;
}

export interface CartItem {
  key: string;
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price: string | number;
  image?: string | null;
  attributes?: CartItemAttribute[];
}

export interface CouponDTO {
  code: string;
  amount: number;
}

export interface CartData {
  subtotal: string;
  total: string;
  shippingTotal: string;
  discountTotal: string;
  // ✅ FIX: taxTotal added — was calculated in CheckoutClient but never shown.
  // Australian law requires GST to be shown on checkout summaries.
  taxTotal?: string;
  appliedCoupons: CouponDTO[];
}

export interface ShippingRate {
  id: string;
  label: string;
  cost: number;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  cartData: CartData | null;
  onRemoveCoupon: (couponCode: string) => Promise<void>;
  isRemovingCoupon: boolean;
  onApplyCoupon: (couponCode: string) => Promise<void>;
  isApplyingCoupon: boolean;
  rates: ShippingRate[];
  selectedRateId: string;
  onRateSelect: (rateId: string) => void;
  isLoadingShipping: boolean;
  addressEntered: boolean;
}

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export default function OrderSummary({
  cartItems,
  cartData,
  onRemoveCoupon,
  isRemovingCoupon,
  onApplyCoupon,
  isApplyingCoupon,
  rates,
  selectedRateId,
  onRateSelect,
  isLoadingShipping,
  addressEntered,
}: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState('');

  const handleApplyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (couponCode.trim()) onApplyCoupon(couponCode.trim());
  };

  const subtotalDisplay = cartData?.subtotal || '$0.00';
  const totalDisplay = cartData?.total || '$0.00';

  const formatLabel = (name: string) => {
    const clean = name.replace(/^pa_/, '').replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const formatPrice = (price: string | number) => {
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(price);
    }
    return price;
  };

  // Check if GST has a non-zero value to display
  const hasGST = cartData?.taxTotal && cartData.taxTotal !== '$0.00' && cartData.taxTotal !== 'A$0.00';
  const hasDiscount = cartData?.appliedCoupons && cartData.appliedCoupons.length > 0;

  return (
    <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-2 md:p-6 w-full">
      <h2 className="mt-0 mb-6 text-[1.75rem] font-bold text-[#1d1d1d] border-b border-[#e0e0e0] pb-4 text-center md:text-left">
        Your Order
      </h2>

      {/* Cart Items */}
      <div className="flex flex-col gap-4 mb-5">
        {cartItems.map(item => (
          <div key={item.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="relative w-16 h-16">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="rounded border border-[#eee] object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded" />
              )}
              <span className="absolute -top-2 -right-2 bg-[#333] text-white rounded-full w-6 h-6 flex items-center justify-center text-[0.8rem] font-bold border-2 border-[#f9f9f9]">
                {item.quantity}
              </span>
            </div>

            <div className="pr-4">
              <p className="m-0 font-semibold text-[#333] text-[0.95rem]">{item.name}</p>
              {item.attributes && item.attributes.length > 0 && (
                <div className="text-[13px] text-[#666] mt-1">
                  {item.attributes.map((attr, index) => (
                    <div key={index}>
                      <strong>{formatLabel(attr.name)}:</strong> {attr.value}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="m-0 font-semibold whitespace-nowrap text-base md:text-[1rem]">
              {formatPrice(item.price)}
            </p>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-[#e0e0e0] mt-6 pt-6 flex flex-col gap-3">
        <div className="flex justify-between items-center text-base text-[#555]">
          <p className="font-semibold text-[1.1rem] text-black m-0">Subtotal</p>
          <span className="font-semibold text-[1.2rem] text-black">{subtotalDisplay}</span>
        </div>
      </div>

      {/* Coupon Input */}
      <div className="border-t border-[#e0e0e0] mt-4 pt-4">
        <h3 className="mt-0 mb-4 text-[1.1rem] font-semibold md:text-[1rem]">Have a Coupon Code?</h3>
        <div className="flex gap-2 flex-col md:flex-row">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyClick(e as any)}
            placeholder="Coupon code"
            className="flex-grow p-3 text-base border border-[#ccc] rounded w-full"
            disabled={isApplyingCoupon || (cartData?.appliedCoupons?.length ?? 0) > 0}
          />
          <button
            onClick={handleApplyClick}
            className="p-3 px-6 text-base font-semibold text-white bg-[#333] border border-[#333] rounded cursor-pointer transition-all duration-200 hover:bg-black disabled:bg-[#575757] disabled:border-[#aaa] disabled:cursor-not-allowed w-full md:w-auto"
            disabled={isApplyingCoupon || !couponCode.trim() || (cartData?.appliedCoupons?.length ?? 0) > 0}
          >
            {isApplyingCoupon ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Totals breakdown */}
      <div className="border-t border-[#e0e0e0] mt-6 pt-6 flex flex-col gap-4">

        {/* Applied Coupon */}
        {hasDiscount && cartData?.appliedCoupons?.map(coupon => (
          <div key={coupon.code} className="flex justify-between items-center text-base text-[#555]">
            <span className="font-medium">Coupon: <strong>{coupon.code}</strong></span>
            <div className="flex items-center gap-2 text-[#e53935]">
              <span>-{cartData.discountTotal || '$0.00'}</span>
              <button
                onClick={() => onRemoveCoupon(coupon.code)}
                className="bg-none border-none text-[#007bff] cursor-pointer text-[0.8rem] p-0 disabled:text-[#999] disabled:cursor-not-allowed underline"
                disabled={isRemovingCoupon}
              >
                {isRemovingCoupon ? '[Removing...]' : '[Remove]'}
              </button>
            </div>
          </div>
        ))}

        {/* Shipping rates */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center text-base text-[#555] mb-2">
            <span className="text-[1.5rem] md:text-[1.1rem]">Shipping</span>
          </div>
          <div className="flex flex-col gap-[0.2rem]">
            {isLoadingShipping ? (
              <div className="p-4 text-left text-[#777]">
                <span>Calculating shipping...</span>
              </div>
            ) : rates.length > 0 ? (
              rates.map(rate => (
                <div
                  key={rate.id}
                  className={`border border-[#ddd] rounded-[5px] transition-colors duration-200 cursor-pointer ${selectedRateId === rate.id ? 'border-[#b39f9f] bg-[#e9f5ff]' : ''}`}
                  onClick={() => onRateSelect(rate.id)}
                >
                  <label
                    htmlFor={rate.id}
                    className="flex items-center p-[0.3rem_0.5rem] w-full cursor-pointer md:p-1 md:text-[0.9rem]"
                  >
                    <input
                      type="radio"
                      id={rate.id}
                      name="shipping_method"
                      value={rate.id}
                      checked={selectedRateId === rate.id}
                      readOnly
                      className="mr-2 accent-[#ff0000]"
                    />
                    <span className="flex-grow text-[#2b2b2b]">{rate.label}</span>
                    <strong className="font-bold text-black">{formatPrice(rate.cost)}</strong>
                  </label>
                </div>
              ))
            ) : (
              <div className="p-4 text-left text-[#777]">
                <p>
                  {addressEntered
                    ? 'No shipping options found for your address.'
                    : 'Enter your address to view shipping options.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ NEW: GST line — required for Australian checkout compliance */}
        {hasGST && (
          <div className="flex justify-between items-center text-sm text-[#666] bg-[#f0f0f0] px-3 py-2 rounded">
            <span className="flex items-center gap-1">
              {/* Info icon */}
              <svg className="w-3.5 h-3.5 text-[#888]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              GST included in total
            </span>
            <span className="font-semibold text-[#444]">{cartData!.taxTotal}</span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center text-[#555] font-bold border-t-2 border-[#333] pt-4 mt-2">
          <span className="text-[#1d1d1d] text-[1.6rem] font-extrabold md:text-[1.5rem]">Total</span>
          <span className="font-semibold text-black text-[1.6rem] md:text-[1.5rem]">{totalDisplay}</span>
        </div>
      </div>
    </div>
  );
}