// app/(frontend)/cart/CartClient.tsx
"use client";

import Breadcrumbs from '@/components/Breadcrumbs';
import { useCart, CartItemAttribute } from '@/context/CartContext';
import Link from 'next/link';
import { gtmViewCart, gtmBeginCheckout } from '@/lib/gtm';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ProductCard from '@/components/ProductCard';
import { StorefrontProduct } from '@/app/(frontend)/types';
import { getCrossSellProductsAction } from '@/app/actions/frontend/cart/getCrossSellProductsAction';

interface AppliedCoupon {
  code: string;
  amount: number;
}

export default function CartClient() {
  const { cartItems, updateQuantity, removeFromCart, loading: isCartLoading } = useCart();
  
  // --- States ---
  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setCouponLoading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  
  // Cross-sell states
  const [crossSellProducts, setCrossSellProducts] = useState<StorefrontProduct[]>([]);
  const [isCrossSellLoading, setIsCrossSellLoading] = useState(true);

  // --- Dynamic Totals Calculation (GraphQL এর বদলে Client-side calculation) ---
  const parsePrice = (priceStr?: string | null): number => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  const subtotalNum = cartItems.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);
  
  // আপাতত কুপন ডেমো হিসেবে কাজ করবে (যেহেতু এটি পেমেন্ট গেটওয়ের সাথে যুক্ত হবে পরে)
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const discountTotalNum = appliedCoupons.reduce((total, c) => total + c.amount, 0);
  const totalNum = subtotalNum - discountTotalNum;

  const formatPrice = (amount: number) => 
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  // --- Effects ---
  useEffect(() => {
    if (cartItems.length > 0) {
        const gtmItems = cartItems.map(item => {
            return { item_name: item.name, item_id: item.databaseId, price: parsePrice(item.price), quantity: item.quantity };
        });
        gtmViewCart(gtmItems);
    }
  }, [cartItems]);

  useEffect(() => {
    async function fetchCrossSells() {
      const response = await getCrossSellProductsAction();
      if (response.success) {
        setCrossSellProducts(response.products);
      }
      setIsCrossSellLoading(false);
    }
    fetchCrossSells();
  }, []);

  // --- Handlers ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (appliedCoupons.length > 0) {
      toast.error("Only one coupon can be applied per order.");
      return;
    }
    setCouponLoading(true);
    toast.loading('Applying coupon...');
    
    // Simulate API call for now
    setTimeout(() => {
      setAppliedCoupons([{ code: couponCode.trim(), amount: 50 }]); // Dummy $50 discount
      toast.dismiss();
      toast.success('Coupon applied!');
      setCouponCode('');
      setCouponLoading(false);
    }, 1000);
  };

  const handleRemoveCoupon = async (code: string) => {
    setCouponLoading(true);
    toast.loading('Removing coupon...');
    setTimeout(() => {
      setAppliedCoupons([]);
      toast.dismiss();
      toast.success('Coupon removed.');
      setCouponLoading(false);
    }, 500);
  };

  const handleRemoveItem = async (key: string) => {
    setRemovingKey(key);
    await removeFromCart(key);
    setRemovingKey(null);
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
        const gtmItems = cartItems.map(item => {
            return { item_name: item.name, item_id: item.databaseId, price: parsePrice(item.price), quantity: item.quantity };
        });
        gtmBeginCheckout(gtmItems);
    }
  };

  const formatLabel = (name: string) => {
    const clean = name.replace(/^pa_/, '').replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const isLoading = isCartLoading || isCouponLoading;

  return (
    <>
      <Breadcrumbs pageTitle="Shopping Cart" />
      
      {/* Container */}
      <div className="max-w-[1300px] mx-auto px-4 pb-12 font-sans box-border">
        {cartItems.length === 0 && !isCartLoading ? (
          /* Empty Cart Container */
          <div className="text-center py-12 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart is Empty</h1>
            <Link 
                href="/shop" 
                className="inline-block mt-6 px-8 py-3 bg-black text-white rounded-md font-semibold hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-center mb-8 text-3xl font-bold text-gray-900">Your Shopping Cart</h1>
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 flex justify-center items-center text-2xl z-[1000] font-bold">
                    Updating Cart...
                </div>
            )}
            
            {/* Cart Layout Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 items-start ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
              
              {/* Cart Items List */}
              <div className="flex flex-col gap-4">
                {cartItems.map(item => (
                  <div key={item.key} className="flex gap-4 md:gap-6 p-4 md:p-6 border border-gray-200 rounded-lg bg-white items-start">
                    {item.image ? ( 
                        <Image 
                            src={item.image} 
                            alt={item.name} 
                            className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] object-cover rounded-md border border-gray-100 shrink-0" 
                            width={100} 
                            height={100}
                        /> 
                    ) : ( 
                        <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] bg-gray-100 rounded-md shrink-0" /> 
                    )}
                    
                    <div className="flex-grow flex flex-col gap-2">
                      <h2 className="text-base md:text-lg font-semibold m-0 text-gray-900 leading-snug">{item.name}</h2>
                      
                      {item.attributes && item.attributes.length > 0 && (
                        <div style={{ marginTop: '5px', fontSize: '14px', color: '#555' }}>
                          {item.attributes.map((attr: CartItemAttribute, index: number) => (
                            <span key={index} style={{ marginRight: '10px', display: 'inline-block' }}>
                                <strong>{formatLabel(attr.name)}:</strong> {attr.value}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col items-start gap-3 mt-2">
                          <p className="m-0 font-bold text-lg text-gray-900" dangerouslySetInnerHTML={{ __html: item.price }}></p>
                          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                            <button 
                                onClick={() => updateQuantity(item.key, item.quantity - 1)} 
                                disabled={isLoading || item.quantity <= 1}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-200 disabled:opacity-50 font-bold text-base transition-colors"
                            >
                                -
                            </button>
                            <span className="px-3 font-semibold text-base">{item.quantity}</span>
                            <button 
                                onClick={() => updateQuantity(item.key, item.quantity + 1)} 
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-200 disabled:opacity-50 font-bold text-base transition-colors"
                            >
                                +
                            </button>
                          </div>
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleRemoveItem(item.key)} 
                              className="bg-transparent border-none text-red-600 p-0 text-sm cursor-pointer underline mt-0.5 hover:text-red-700 hover:no-underline transition-colors disabled:opacity-50" 
                              disabled={isLoading || removingKey === item.key}
                              style={{ opacity: removingKey === item.key ? 0.7 : 1 }}
                            >
                             {removingKey === item.key ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary (Right Sidebar) */}
              <div className="border border-gray-200 p-6 rounded-lg bg-gray-50 sticky top-[100px]">
                <h2 className="mt-0 mb-6 text-2xl font-bold border-b border-gray-200 pb-4">Order Summary</h2>
                <div className="flex justify-between mb-4 text-base text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalNum)}</span>
                </div>
                
                {/* Coupon Section */}
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode} 
                        onChange={(e) => setCouponCode(e.target.value)} 
                        placeholder="Coupon code" 
                        className="flex-grow p-2.5 border border-gray-300 rounded text-sm" 
                        disabled={isLoading}
                      />
                      <button 
                        onClick={handleApplyCoupon} 
                        className="px-4 py-2.5 bg-gray-700 text-white rounded font-semibold text-sm hover:bg-gray-900 disabled:bg-gray-400 transition-colors" 
                        disabled={isLoading || !couponCode.trim()}
                      >
                          {isCouponLoading ? 'Applying...' : 'Apply'}
                      </button>
                  </div>
                </div>

                {appliedCoupons.map((coupon) => (
                  <div key={coupon.code} className="flex justify-between mb-4 text-sm text-green-600">
                    <span>Coupon: {coupon.code}</span>
                    <div className="flex items-center">
                      <span>-{formatPrice(coupon.amount)}</span>
                      <button 
                        onClick={() => handleRemoveCoupon(coupon.code)} 
                        className="bg-transparent border-none text-red-600 ml-1.5 text-xs underline cursor-pointer hover:no-underline disabled:opacity-50" 
                        disabled={isLoading}
                      >
                        [Remove]
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t-2 border-gray-200 pt-4 mt-4 mb-6">
                  <strong>Total</strong>
                  <strong>{formatPrice(totalNum)}</strong>
                </div>
                
                <Link 
                    href="/checkout" 
                    className="block text-center w-full p-4 text-lg bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors border-none cursor-pointer" 
                    onClick={handleCheckout}
                >
                    Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
        
        {/* === CROSS SELL SECTION (Merged into same file) === */}
        {cartItems.length > 0 && !isCrossSellLoading && crossSellProducts.length > 0 && (
          <section className="mt-16 pt-8 border-t border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {crossSellProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
        
      </div>
    </>
  );
}