//app/(storefront)/checkout/page.tsx

import { getAvailablePaymentMethods } from '@/app/actions/storefront/checkout/get-available-payments';
import { getShippingRates } from '@/app/actions/storefront/checkout/get-shipping-rates';
import { getCartDetails } from '@/app/actions/storefront/cart/get-cart-details';
import { cookies } from 'next/headers';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  // Initial Load (Default Rates)
  const [paymentMethods, initialRates, cartResult] = await Promise.all([
    getAvailablePaymentMethods(),
    getShippingRates(), // No params = default rates
    getCartDetails(cartId)
  ]);

  const rawItems = cartResult.success && cartResult.data ? cartResult.data.items : [];
  
  const formattedCartItems = rawItems.map((item: any) => ({
    id: item.variantId || item.productId,
    databaseId: item.id,
    name: item.variant ? `${item.product.name} - ${item.variant.name}` : item.product.name,
    price: item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price),
    quantity: item.quantity,
    image: item.variant?.image || item.product.featuredImage || "/placeholder.png",
    // Transdirect needs these later
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
          cartId={cartId || ""} // 👈 Passing Cart ID for dynamic rates
        />
      </div>
    </div>
  );
}