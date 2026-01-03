// File: app/(storefront)/cart/page.tsx

import { cookies } from "next/headers";
import { getCartDetails } from "@/app/actions/storefront/cart/get-cart-details";
// import { mergeCart } from ... (সরিয়ে ফেলা হয়েছে)
import { Cart_Client_Wrapper } from "./_components/Cart_Client_Wrapper";
import { Empty_Cart_State } from "./_components/Empty_Cart_State";

export const metadata = {
  title: "Shopping Cart - GoBike",
  description: "Review your selected items",
};

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  const { success, data, appliedCoupon } = await getCartDetails(cartId);

  // কার্ট খালি চেক
  const isEmpty = !success || !data || !data.items || data.items.length === 0;

  if (isEmpty) {
    return (
      <div className="container max-w-7xl mx-auto px-4 min-h-[60vh]">
      
        <Empty_Cart_State /> 
        
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-heading">
          Shopping Cart ({data.items.length})
        </h1>
        
        <Cart_Client_Wrapper cart={data} initialCoupon={appliedCoupon} />
      </div>
    </div>
  );
}