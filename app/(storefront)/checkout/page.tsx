// File: app/(storefront)/checkout/page.tsx

import { cookies } from "next/headers";
import { getCheckoutData } from "@/app/actions/storefront/checkout/get-checkout-data";
import { Checkout_Client_Wrapper } from "./_components/Checkout_Client_Wrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Checkout - GoBike",
  description: "Secure checkout page",
};

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  // ১. সার্ভার অ্যাকশন কল করে ডাটা আনা (Cart, User, Settings)
  const { success, data, error } = await getCheckoutData(cartId);

  // ২. যদি কার্ট খালি থাকে বা এরর হয়
  if (!success || !data) {
    return (
      <div className="container max-w-4xl mx-auto py-20 px-4">
        <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-900">
          <ShoppingBag className="h-4 w-4" />
          <AlertTitle>Cart Issue</AlertTitle>
          <AlertDescription>{error || "Your cart is empty."}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/">Return to Shop</Link>
        </Button>
      </div>
    );
  }

  // ৩. ডাটা পেলে ক্লায়েন্ট র্যাপারে পাঠানো
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="container max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-heading">Checkout</h1>
        
        {/* মেইন ফর্ম এবং লজিক সব এই র্যাপারের ভেতরে থাকবে */}
        <Checkout_Client_Wrapper initialData={data} cartId={cartId!} />
      </div>
    </div>
  );
}