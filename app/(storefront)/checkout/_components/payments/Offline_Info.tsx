// File: app/(storefront)/checkout/_components/payments/Offline_Info.tsx

"use client";

import { useState } from "react";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const Offline_Info = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, billingAddress, selectedShippingMethod, couponCode, totals } = useCheckoutStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    setLoading(true);

    // ১. ভ্যালিডেশন
    if (!shippingAddress.firstName || !shippingAddress.address1) {
        toast.error("Please fill in shipping address.");
        setLoading(false);
        return;
    }
    if (!selectedShippingMethod) {
        toast.error("Please select a shipping method.");
        setLoading(false);
        return;
    }

    // ২. সার্ভার অ্যাকশন কল (অর্ডার প্রসেস)
    const res = await processCheckout({
        cartId: cartId!,
        shippingAddress,
        billingAddress,
        paymentMethod: methodConfig.identifier,
        shippingData: {
            method: selectedShippingMethod.type,
            carrier: selectedShippingMethod.name,
            cost: selectedShippingMethod.price,
            methodId: selectedShippingMethod.id
        },
        couponCode: couponCode || undefined,
        totals: { ...totals } // Note: Server ignores this and recalculates
    });

    // ৩. রেসপন্স হ্যান্ডলিং
    if (res.success) {
        toast.success("Order placed successfully!");
        router.push(`/checkout/success/${res.orderId}`);
    } else {
        toast.error(res.error || "Failed to place order.");
        setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-sm text-gray-600 prose-sm" dangerouslySetInnerHTML={{ __html: methodConfig.instructions || "" }} />
      
      {/* Bank Details (Specific Logic) */}
      {methodConfig.identifier === "bank_transfer" && methodConfig.offlineConfig?.bankDetails && (
        <div className="mt-3 p-3 bg-white border rounded text-xs text-gray-700">
            {methodConfig.offlineConfig.bankDetails.map((bank: any, i: number) => (
                <div key={i} className="mb-2 last:mb-0">
                    <p><strong>Bank:</strong> {bank.bankName}</p>
                    <p><strong>Account:</strong> {bank.accountNumber}</p>
                    <p><strong>Name:</strong> {bank.accountName}</p>
                    <p><strong>BSB/Sort:</strong> {bank.sortCode}</p>
                </div>
            ))}
        </div>
      )}

      <Button 
        onClick={handlePlaceOrder} 
        disabled={loading} 
        className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-semibold mt-4"
      >
        {loading ? <Loader2 className="animate-spin mr-2" /> : `Place Order`}
      </Button>
    </div>
  );
};