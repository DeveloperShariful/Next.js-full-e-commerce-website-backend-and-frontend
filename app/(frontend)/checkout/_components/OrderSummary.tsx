//app/(frontend)/checkout/_components/OrderSummary.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

// --- Types (Matched with CartContext and CheckoutClient) ---
interface CartItemAttribute { 
  id: string; 
  label: string; 
  value: string; 
  name: string; 
}

interface CartItem { 
  id: string; 
  databaseId: number; 
  name: string; 
  quantity: number; 
  price: string; 
  image?: string | null; 
  key: string;
  attributes?: CartItemAttribute[]; 
}

interface ShippingRate { 
  id: string; 
  label: string; 
  cost: string; 
}

interface AppliedCoupon { 
  code: string; 
  amount: number; 
}

interface OrderSummaryProps { 
  cartItems: CartItem[]; 
  subtotal: number;
  total: number;
  shippingTotal: number;
  rates: ShippingRate[]; 
  selectedRateId: string; 
  onRateSelect: (rateId: string) => void; 
  isLoadingShipping: boolean; 
  addressEntered: boolean; 
  // কুপন লজিক আপাতত ডামি রাখা হয়েছে, ব্যাকএন্ড রেডি হলে কানেক্ট করা যাবে
  appliedCoupons?: AppliedCoupon[];
  onRemoveCoupon?: (couponCode: string) => Promise<void>; 
  isRemovingCoupon?: boolean; 
  onApplyCoupon?: (couponCode: string) => Promise<void>; 
  isApplyingCoupon?: boolean; 
}

export default function OrderSummary(props: OrderSummaryProps) {
  const { 
    cartItems, 
    subtotal, 
    total, 
    shippingTotal,
    rates, 
    selectedRateId, 
    onRateSelect, 
    isLoadingShipping, 
    addressEntered,
    appliedCoupons = [],
    onRemoveCoupon,
    isRemovingCoupon = false,
    onApplyCoupon,
    isApplyingCoupon = false
  } = props;

  const [couponCode, setCouponCode] = useState('');

  const handleApplyClick = (e: React.MouseEvent<HTMLButtonElement>) => { 
    e.preventDefault(); 
    if (couponCode.trim() && onApplyCoupon) { 
      onApplyCoupon(couponCode.trim()); 
    } 
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);
  };

  const formatLabel = (name: string) => { 
    const clean = name.replace(/^pa_/, '').replace(/_/g, ' '); 
    return clean.charAt(0).toUpperCase() + clean.slice(1); 
  };

  return (
    <div className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-2 md:p-6 w-full"> 
      <h2 className="mt-0 mb-6 text-[1.75rem] font-bold text-[#1d1d1d] border-b border-[#e0e0e0] pb-4 text-center md:text-left">
        Your Order
      </h2>

      {/* Cart Items List */}
      <div className="flex flex-col gap-4 mb-5">
        {cartItems.map(item => (
          <div key={item.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
             <div className="relative w-16 h-16">
              {item.image ? (
                <Image src={item.image} alt={item.name} width={64} height={64} className="rounded border border-[#eee]" />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded border border-gray-100 flex items-center justify-center text-gray-400 text-[10px]">No Image</div>
              )}
              <span className="absolute -top-2 -right-2 bg-[#333] text-white rounded-full w-6 h-6 flex items-center justify-center text-[0.8rem] font-bold border-2 border-[#f9f9f9]">{item.quantity}</span>
            </div>
            
            <div className="pr-4">
              <p className="m-0 font-semibold text-[#333] text-[0.95rem] line-clamp-2">{item.name}</p>
              {item.attributes && item.attributes.length > 0 && (
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {item.attributes.map((attr, index) => (
                    <span key={index} className="mr-2 inline-block"><strong>{formatLabel(attr.name)}:</strong> {attr.value}</span>
                  ))}
                </div>
              )}
            </div>
            {/* Price is already a string like "$100.00" from context */}
            <p className="m-0 font-semibold whitespace-nowrap text-base md:text-[1rem]">{item.price}</p>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-[#e0e0e0] mt-6 pt-6 flex flex-col gap-4">
        <div className="flex justify-between items-center text-base text-[#555]">
          <p className="font-semibold text-[1.1rem] text-black m-0">Subtotal</p>
          <span className="font-semibold text-[1.2rem] text-black">{formatPrice(subtotal)}</span>
        </div>
      </div>

      {/* Coupon Field */}
      <div className="border-t border-[#e0e0e0] mt-4 pt-4">
        <h3 className="mt-0 mb-4 text-[1.1rem] font-semibold md:text-[1rem]">Have a Coupon Code?</h3>
        <div className="flex gap-2 flex-col md:flex-row">
          <input 
            type="text" 
            value={couponCode} 
            onChange={(e) => setCouponCode(e.target.value)} 
            placeholder="Coupon code" 
            className="flex-grow p-3 text-base border border-[#ccc] rounded w-full outline-none focus:border-blue-500" 
            disabled={isApplyingCoupon} 
          />
          <button 
            onClick={handleApplyClick} 
            className="p-3 px-6 text-base font-semibold text-white bg-[#333] border border-[#333] rounded cursor-pointer transition-all duration-200 hover:bg-black disabled:bg-[#575757] disabled:border-[#aaa] disabled:cursor-not-allowed w-full md:w-auto" 
            disabled={isApplyingCoupon || !couponCode.trim()}
          >
            {isApplyingCoupon ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
      
      {/* Applied Coupons List */}
      <div className="border-t border-[#e0e0e0] mt-6 pt-6 flex flex-col gap-4">
        {appliedCoupons.map(coupon => (
          <div key={coupon.code} className="flex justify-between items-center text-base text-[#555]">
            <span className="font-medium">Coupon: {coupon.code}</span>
            <div className="flex items-center gap-2 text-[#e53935]">
              <span>-{formatPrice(coupon.amount)}</span>
              {onRemoveCoupon && (
                <button 
                  onClick={() => onRemoveCoupon(coupon.code)} 
                  className="bg-transparent border-none text-[#007bff] cursor-pointer text-[0.8rem] p-0 disabled:text-[#999] disabled:cursor-not-allowed" 
                  disabled={isRemovingCoupon}
                >
                  {isRemovingCoupon ? "[Removing...]" : "[Remove]"}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Shipping Selection */}
        <div className="flex flex-col mt-[-0.5rem]">
          <div className="flex justify-between items-center text-base text-[#555] mb-2 text-[1.5rem] md:text-[1.1rem]">
            <span className="font-semibold text-black m-0">Shipping</span>
            {shippingTotal > 0 && <span className="font-semibold text-black">{formatPrice(shippingTotal)}</span>}
          </div>
          <div className="flex flex-col gap-[0.2rem]">
            {isLoadingShipping ? (
              <div className="p-4 text-center text-[#777] bg-white border border-gray-200 rounded animate-pulse">
                <span>Calculating shipping...</span>
              </div>
            ) : rates.length > 0 ? (
              rates.map((rate) => (
                <div key={rate.id} className={`border border-[#ddd] rounded-[5px] transition-colors duration-200 cursor-pointer ${selectedRateId === rate.id ? 'border-blue-300 bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`} onClick={() => onRateSelect(rate.id)}>
                  <label htmlFor={rate.id} className="flex items-center p-[0.3rem_0.5rem] w-full cursor-pointer md:p-3 md:text-[0.9rem]">
                    <input type="radio" id={rate.id} name="shipping_method" value={rate.id} checked={selectedRateId === rate.id} readOnly className="mr-3 w-4 h-4 accent-blue-600" />
                    <span className="flex-grow text-[#2b2b2b]">{rate.label}</span>
                    <strong className="font-bold text-black">{formatPrice(parseFloat(rate.cost))}</strong>
                  </label>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-[#777] bg-white border border-gray-200 rounded">
                <p className="m-0 text-sm">{addressEntered ? 'No shipping options found for your address.' : 'Enter your address to view shipping options.'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center text-[#555] text-[1.6rem] font-bold border-t-2 border-[#333] pt-4 mt-2 md:text-[1.5rem] md:pt-3">
          <span className="text-[#1d1d1d] text-[1.6rem] font-extrabold m-0">Total</span>
          <span className="font-semibold text-black">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}