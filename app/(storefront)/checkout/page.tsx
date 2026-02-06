//app/(storefront)/checkout/page.tsx

import { getAvailablePaymentMethods } from '@/app/actions/storefront/checkout/get-available-payments';
import { getShippingRates } from '@/app/actions/storefront/checkout/get-shipping-rates';
import { getCartDetails } from '@/app/actions/storefront/cart/get-cart-details';
import { cookies } from 'next/headers';
import CheckoutClient from './CheckoutClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const cookieCartId = cookieStore.get("cartId")?.value;

  // 1. Fetch Data
  const [paymentMethods, initialRates, cartResult] = await Promise.all([
    getAvailablePaymentMethods(),
    getShippingRates(), 
    getCartDetails(cookieCartId)
  ]);

  // 2. Resolve Active Cart ID (CRITICAL FIX)
  // যদি কুকিতে আইডি না থাকে কিন্তু সার্ভার ইউজারের কার্ট খুঁজে পায়, তবে সেই আইডি ব্যবহার হবে।
  const cartData = cartResult.success ? cartResult.data : null;
  const activeCartId = cartData?.id || cookieCartId || "";

  // যদি কোনো কার্ট না থাকে বা কার্ট খালি থাকে, শপে রিডাইরেক্ট করুন
  if (!activeCartId || !cartData || cartData.items.length === 0) {
      redirect('/cart');
  }

  const rawItems = cartData.items;
  
  const formattedCartItems = rawItems.map((item: any) => ({
    id: item.variantId || item.productId,
    databaseId: item.id,
    name: item.variant ? `${item.product.name} - ${item.variant.name}` : item.product.name,
    price: item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price),
    quantity: item.quantity,
    image: item.variant?.image || item.product.featuredImage || "/placeholder.png",
    weight: item.variant?.weight || item.product.weight,
    length: item.variant?.length || item.product.length,
    width: item.variant?.width || item.product.width,
    height: item.variant?.height || item.product.height,
  }));

  const stripeMethod = paymentMethods.find(p => p.provider === 'stripe');
  const paypalMethod = paymentMethods.find(p => p.provider === 'paypal');

  return (
    <div className="w-full p-4 md:p-8 bg-[#f8f9fa]">
      <div className="w-full max-w-full mx-auto relative overflow-x-hidden">
        <CheckoutClient 
          initialPaymentMethods={paymentMethods} 
          initialShippingRates={initialRates}
          initialCartItems={formattedCartItems}
          stripePublishableKey={stripeMethod?.public_key || ""}
          paypalClientId={paypalMethod?.public_key || ""}
          cartId={activeCartId} // ✅ Passing Verified Cart ID
        />
      </div>
    </div>
  );
}