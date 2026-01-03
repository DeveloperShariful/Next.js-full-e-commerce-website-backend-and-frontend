// File: app/(storefront)/checkout/page.tsx

import { getCheckoutData } from "@/app/actions/storefront/checkout/get-checkout-data";
import { Checkout_Client_Wrapper } from "./_components/Checkout_Client_Wrapper";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Secure Checkout - GoBike",
};

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    redirect("/cart");
  }

  const { success, data } = await getCheckoutData(cartId);

  if (!success || !data) {
    redirect("/cart");
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      {/* Client Component Load */}
      <Checkout_Client_Wrapper 
          initialData={data} 
          cartId={cartId}
      />
    </div>
  );
}