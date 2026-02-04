//app/(storefront)/checkout/_components/OrderSummary.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGlobalStore } from '@/app/providers/global-store-provider';
import { Tag, X } from 'lucide-react'; // আইকনের জন্য (অপশনাল)

interface CartItem { id: string; name: string; quantity: number; price: number; image?: string; }
interface ShippingOption { id: string; label: string; cost: number; }

interface OrderSummaryProps { 
  cartItems: CartItem[]; 
  totals: { subtotal: number; shipping: number; total: number; discount: number }; 
  rates: ShippingOption[]; 
  selectedRateId: string; 
  onRateSelect: (rateId: string) => void;
  isLoadingShipping: boolean;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
  appliedCouponCode: string;
  isApplyingCoupon: boolean;
}

export default function OrderSummary({ 
  cartItems, 
  totals, 
  rates, 
  selectedRateId, 
  onRateSelect, 
  isLoadingShipping,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCouponCode,
  isApplyingCoupon
}: OrderSummaryProps) {
  
  const { formatPrice, primaryColor } = useGlobalStore();
  const [couponInput, setCouponInput] = useState('');

  const handleApplyClick = async () => {
    if (!couponInput.trim()) return;
    await onApplyCoupon(couponInput);
    setCouponInput(''); // ইনপুট ক্লিয়ার করা
  };

  return (
    <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-2 md:p-6 w-full"> 
      <h2 className="mt-0 mb-6 text-[1.75rem] font-bold text-[#1d1d1d] border-b border-[#e0e0e0] pb-4 text-center md:text-left">Your Order</h2>

      {/* Items */}
      <div className="flex flex-col gap-4 mb-5">
        {cartItems.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
             <div className="relative w-16 h-16 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No Img</span>
              )}
              <span className="absolute -top-2 -right-2 bg-[#333] text-white rounded-full w-6 h-6 flex items-center justify-center text-[0.8rem] font-bold border-2 border-[#f9f9f9]">{item.quantity}</span>
            </div>
            
            <div className="pr-4">
              <p className="m-0 font-semibold text-[#333] text-[0.95rem]">{item.name}</p>
            </div>
            <p className="m-0 font-semibold whitespace-nowrap text-base md:text-[1rem]">
                {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-[#e0e0e0] mt-6 pt-6 flex flex-col gap-4">
        <div className="flex justify-between items-center text-base text-[#555]">
          <p className="font-semibold text-[1.1rem] text-black">Subtotal</p>
          <span className="font-semibold text-[1.2rem] text-black">{formatPrice(totals.subtotal)}</span>
        </div>
      </div>

      {/* ================= COUPON SECTION (Added Here) ================= */}
      <div className="border-t border-[#e0e0e0] mt-4 pt-4">
        {appliedCouponCode ? (
          // কুপন অ্যাপ্লাই করার পর যা দেখাবে
          <div className="flex justify-between items-center bg-green-50 border border-green-200 p-3 rounded text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <Tag size={16} />
              <span className="font-semibold">Coupon: {appliedCouponCode}</span>
            </div>
            <button 
              onClick={onRemoveCoupon}
              className="text-red-500 hover:text-red-700 font-medium text-xs flex items-center gap-1"
            >
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          // কুপন ইনপুট ফিল্ড
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
              className="flex-grow border border-[#ddd] rounded px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
            <button 
              onClick={handleApplyClick}
              disabled={isApplyingCoupon || !couponInput.trim()}
              className="bg-[#333] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApplyingCoupon ? '...' : 'Apply'}
            </button>
          </div>
        )}

        {/* Discount Row (যদি ডিসকাউন্ট থাকে তবেই দেখাবে) */}
        {totals.discount > 0 && (
          <div className="flex justify-between items-center text-base text-green-600 mt-3 animate-fadeIn">
            <p className="font-semibold text-[1rem]">Discount</p>
            <span className="font-semibold text-[1rem]">- {formatPrice(totals.discount)}</span>
          </div>
        )}
      </div>
      {/* =============================================================== */}

      {/* Shipping Section */}
      <div className="border-t border-[#e0e0e0] mt-4 pt-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center text-base text-[#555] mb-2 text-[1.5rem] md:text-[1.1rem]">
            <span>Shipping</span>
          </div>
          
          <div className="flex flex-col gap-[0.2rem]">
            {isLoadingShipping ? (
               <div className="p-4 text-left text-[#777] animate-pulse">
                 calculating shipping rates...
               </div>
            ) : 
            rates.length > 0 ? (
              rates.map((rate) => (
                <div 
                    key={rate.id} 
                    className={`border rounded-[5px] transition-colors duration-200 cursor-pointer ${selectedRateId === rate.id ? 'border-[#b39f9f] bg-[#e9f5ff]' : 'border-[#ddd]'}`} 
                    onClick={() => onRateSelect(rate.id)}
                >
                  <label htmlFor={rate.id} className="flex items-center p-[0.3rem_0.5rem] w-full cursor-pointer md:p-1 md:text-[0.9rem]">
                    <input 
                        type="radio" 
                        id={rate.id} 
                        name="shipping_method" 
                        value={rate.id} 
                        checked={selectedRateId === rate.id} 
                        readOnly 
                        className="mr-2"
                        style={{ accentColor: primaryColor }}
                    />
                    <span className="flex-grow text-[#2b2b2b]">{rate.label}</span>
                    <strong className="font-bold text-black">{formatPrice(rate.cost)}</strong>
                  </label>
                </div>
              ))
            ) : (
              <div className="p-4 text-left text-[#777]">
                <p>Enter address to calculate shipping.</p>
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center text-[#555] text-[1.6rem] font-bold border-t-2 border-[#333] pt-4 mt-2 md:text-[1.5rem] md:pt-3">
          <span className="text-[#1d1d1d] text-[1.6rem] font-extrabold">Total</span>
          <span className="font-semibold text-black">
             {isLoadingShipping ? '...' : formatPrice(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}