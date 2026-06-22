// app/(frontend)/cart/CartClient.tsx
"use client";

import Breadcrumbs from '@/components/Breadcrumbs';
import { useCart, CartItemAttribute } from '@/context/CartContext';
import Link from 'next/link';
import { gtmViewCart, gtmBeginCheckout } from '@/lib/gtm';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import { StorefrontProduct } from '@/app/(frontend)/types';
import { getCrossSellProductsAction } from '@/app/actions/frontend/cart/getCrossSellProductsAction';

export default function CartClient() {
  // ✅ FIX: Now using real CartContext values for appliedCoupons, applyCoupon, removeCoupon.
  // Before: Local useState with a fake setTimeout that hardcoded $50 discount — never saved to DB.
  // After: CartContext.applyCoupon() calls applyCouponAction() → saves to cart.appliedCoupons in DB
  //        → persists on refresh → visible on checkout page.
  const {
    cartItems,
    appliedCoupons,   // ✅ Real DB-persisted coupons from CartContext
    applyCoupon,      // ✅ Real action: validates + saves to DB
    removeCoupon,     // ✅ Real action: removes from DB
    updateQuantity,
    removeFromCart,
    loading: isCartLoading
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isCouponLoading, setCouponLoading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const [crossSellProducts, setCrossSellProducts] = useState<StorefrontProduct[]>([]);
  const [isCrossSellLoading, setIsCrossSellLoading] = useState(true);

  const parsePrice = (priceStr?: string | null): number => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  const subtotalNum = cartItems.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);

  // ✅ FIX: Use real CartContext appliedCoupons for discount calculation
  // Before: local [appliedCoupons, setAppliedCoupons] — lost on refresh, hardcoded $50
  // After: CartContext.appliedCoupons — from DB, real discount amount, survives refresh
  const discountTotalNum = appliedCoupons.reduce((total, c) => total + c.amount, 0);
  const totalNum = subtotalNum - discountTotalNum;

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

  useEffect(() => {
    if (cartItems.length > 0) {
      const gtmItems = cartItems.map(item => ({
        item_name: item.name,
        item_id: item.databaseId,
        price: parsePrice(item.price),
        quantity: item.quantity
      }));
      gtmViewCart(gtmItems);
    }
  }, [cartItems]);

  useEffect(() => {
    async function fetchCrossSells() {
      const response = await getCrossSellProductsAction();
      if (response.success) setCrossSellProducts(response.products);
      setIsCrossSellLoading(false);
    }
    fetchCrossSells();
  }, []);

  // ✅ FIX: Real coupon handler — calls CartContext.applyCoupon() which hits DB
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    const success = await applyCoupon(couponCode.trim());
    if (success) {
      toast.success('Coupon applied!');
      setCouponCode('');
    }
    setCouponLoading(false);
  };

  // ✅ FIX: Real remove handler — calls CartContext.removeCoupon() which clears from DB
  const handleRemoveCoupon = async (code: string) => {
    setCouponLoading(true);
    await removeCoupon(code);
    setCouponLoading(false);
  };

  const handleRemoveItem = async (key: string) => {
    setRemovingKey(key);
    await removeFromCart(key);
    setRemovingKey(null);
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      const gtmItems = cartItems.map(item => ({
        item_name: item.name,
        item_id: item.databaseId,
        price: parsePrice(item.price),
        quantity: item.quantity
      }));
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

      <div className="max-w-[1300px] mx-auto px-4 pb-12 font-sans box-border">
        {cartItems.length === 0 && !isCartLoading ? (
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
            <div className={`grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 items-start ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>

              {/* Cart Items */}
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
                        <p className="m-0 font-bold text-lg text-gray-900" dangerouslySetInnerHTML={{ __html: item.price }} />
                        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            disabled={isLoading || item.quantity <= 1}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-200 disabled:opacity-50 font-bold text-base transition-colors"
                          >-</button>
                          <span className="px-3 font-semibold text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-200 disabled:opacity-50 font-bold text-base transition-colors"
                          >+</button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.key)}
                          className="bg-transparent border-none text-red-600 p-0 text-sm cursor-pointer underline mt-0.5 hover:text-red-700 hover:no-underline transition-colors disabled:opacity-50"
                          disabled={isLoading || removingKey === item.key}
                        >
                          {removingKey === item.key ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Sidebar */}
              <div className="border border-gray-200 p-6 rounded-lg bg-gray-50 sticky top-[100px]">
                <h2 className="mt-0 mb-6 text-2xl font-bold border-b border-gray-200 pb-4">Order Summary</h2>

                <div className="flex justify-between mb-4 text-base text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalNum)}</span>
                </div>

                {/* Coupon Input */}
                <div className="mb-4 border-b border-gray-200 pb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Coupon code"
                      className="flex-grow p-2.5 border border-gray-300 rounded text-sm"
                      disabled={isLoading || appliedCoupons.length > 0}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 bg-gray-700 text-white rounded font-semibold text-sm hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
                      disabled={isLoading || !couponCode.trim() || appliedCoupons.length > 0}
                    >
                      {isCouponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </div>

                {/* Applied Coupons */}
                {appliedCoupons.map((coupon) => (
                  <div key={coupon.code} className="flex justify-between mb-4 text-sm text-green-700 bg-green-50 p-2 rounded">
                    <span className="font-medium">Coupon: <strong>{coupon.code}</strong></span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">-{formatPrice(coupon.amount)}</span>
                      <button
                        onClick={() => handleRemoveCoupon(coupon.code)}
                        className="bg-transparent border-none text-red-600 text-xs underline cursor-pointer hover:no-underline disabled:opacity-50"
                        disabled={isLoading}
                      >
                        [Remove]
                      </button>
                    </div>
                  </div>
                ))}

                {discountTotalNum > 0 && (
                  <div className="flex justify-between mb-3 text-sm text-green-700">
                    <span>Discount</span>
                    <span>-{formatPrice(discountTotalNum)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t-2 border-gray-200 pt-4 mt-2 mb-6">
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

        {/* Cross-sell Section */}
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
