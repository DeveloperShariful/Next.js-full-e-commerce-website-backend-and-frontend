// File: app/(storefront)/cart/_components/Empty_Cart_State.tsx

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const Empty_Cart_State = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-gray-100 p-6 rounded-full">
        <ShoppingBag className="h-12 w-12 text-gray-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          Looks like you haven&apos;t added anything to your cart yet.
        </p>
      </div>
      <Button asChild size="lg" className="mt-4">
        <Link href="/products">Start Shopping</Link>
      </Button>
    </div>
  );
};