// File: app/(storefront)/checkout/_components/Checkout_Client_Wrapper.tsx

"use client";

import { useEffect, useRef } from "react";
import { useCheckoutStore } from "../useCheckoutStore";
import { Checkout_Layout_Grid } from "./Checkout_Layout_Grid";
import { Loader2 } from "lucide-react";

interface WrapperProps {
  initialData: any;
  cartId: string;
}

export const Checkout_Client_Wrapper = ({ initialData, cartId }: WrapperProps) => {
  const initialize = useCheckoutStore((state) => state.initialize);
  const isInitialized = useRef(false);

  useEffect(() => {
    // ডাটা স্টোরে ইনিশিয়ালাইজ করা (একবারই হবে)
    if (!isInitialized.current && initialData) {
      initialize({ ...initialData, cart: { ...initialData.cart, id: cartId } });
      isInitialized.current = true;
    }
  }, [initialData, cartId, initialize]);

  // লোডিং স্টেট (যদি ডাটা না থাকে)
  if (!initialData) {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <Checkout_Layout_Grid />
    </div>
  );
};