// File: app/(storefront)/checkout/_components/summary/Totals_Display.tsx

"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { Skeleton } from "@/components/ui/skeleton";

export const Totals_Display = () => {
  const { totals, isProcessing, selectedShippingMethod, selectedPaymentMethod, settings } = useCheckoutStore();

  const methodConfig = settings?.paymentMethods?.find((m: any) => m.identifier === selectedPaymentMethod);
  const surchargeLabel = methodConfig?.name ? `${methodConfig.name} Fee` : "Payment Fee";

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
            <span className="text-xs text-gray-400 italic">Enter address</span>
        )}
      </div>

      {/* Tax */}
      <div className="flex justify-between text-gray-600">
        <span className="flex items-center gap-1">Estimated Tax</span>
        {isProcessing ? (
            <Skeleton className="h-4 w-12" />
        ) : (
            <span className="font-medium text-gray-900">${totals.tax.toFixed(2)}</span>
        )}
      </div>

      {/* Discount */}
      {totals.discount > 0 && (
        <div className="flex justify-between text-green-600 font-medium animate-in slide-in-from-right-2">
          <span>Discount</span>
          <span>-${totals.discount.toFixed(2)}</span>
        </div>
      )}

      {/* 🔥 Surcharge Display */}
      {totals.surcharge > 0 && (
        <div className="flex justify-between text-gray-600 animate-in slide-in-from-right-2">
          <span>{surchargeLabel}</span>
          <span className="font-medium text-gray-900">+${totals.surcharge.toFixed(2)}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 my-2 pt-2" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-gray-900">Total</span>
        <div className="text-right flex items-baseline gap-1">
            <span className="text-xs text-gray-500 font-normal">AUD</span>
            {isProcessing ? (
                <Skeleton className="h-7 w-24 inline-block align-middle" />
            ) : (
                <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    ${totals.total.toFixed(2)}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};