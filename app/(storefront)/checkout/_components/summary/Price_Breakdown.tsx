// File: app/(storefront)/checkout/_components/summary/Price_Breakdown.tsx
"use client";

import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Skeleton } from "@/components/ui/skeleton";

export const Price_Breakdown = () => {
  const { totals, isProcessing, selectedShippingMethod } = useCheckoutStore();

  return (
    <div className="space-y-3 text-sm">
      
      {/* Subtotal */}
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span className="font-medium text-gray-900">${totals.subtotal.toFixed(2)}</span>
      </div>

      {/* Shipping */}
      <div className="flex justify-between text-gray-600">
        <span>Shipping</span>
        {isProcessing ? (
            <Skeleton className="h-4 w-16" />
        ) : selectedShippingMethod ? (
            <span className="font-medium text-gray-900">
                {totals.shipping === 0 ? "Free" : `$${totals.shipping.toFixed(2)}`}
            </span>
        ) : (
            <span className="text-xs text-gray-400 italic">Calculated next step</span>
        )}
      </div>

      {/* Tax */}
      <div className="flex justify-between text-gray-600">
        <span>Estimated GST (10%)</span>
        {isProcessing ? (
            <Skeleton className="h-4 w-12" />
        ) : (
            <span className="font-medium text-gray-900">${totals.tax.toFixed(2)}</span>
        )}
      </div>

      {/* Discount */}
      {totals.discount > 0 && (
        <div className="flex justify-between text-green-600 font-medium">
          <span>Discount</span>
          <span>-${totals.discount.toFixed(2)}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-2 pt-2" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-gray-900">Total</span>
        <div className="text-right">
            <span className="text-xs text-gray-500 mr-2 font-normal">AUD</span>
            {isProcessing ? (
                <Skeleton className="h-6 w-24 inline-block align-middle" />
            ) : (
                <span className="text-xl font-extrabold text-gray-900">${totals.total.toFixed(2)}</span>
            )}
        </div>
      </div>
    </div>
  );
};