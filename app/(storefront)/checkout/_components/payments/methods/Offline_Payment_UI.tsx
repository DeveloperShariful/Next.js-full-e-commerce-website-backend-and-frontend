// File: app/(storefront)/checkout/_components/payments/methods/Offline_Payment_UI.tsx

"use client";

import { useState } from "react";
import { useCheckoutStore } from "../../../useCheckoutStore";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const Offline_Payment_UI = ({ methodConfig }: { methodConfig: any }) => {
  const { 
    cartId, shippingAddress, billingAddress, isSameBilling,
    selectedShippingMethod, couponCode, totals, user, guestEmail 
  } = useCheckoutStore();
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    setLoading(true);

    const finalBillingAddress = isSameBilling ? shippingAddress : billingAddress;

    // Validations
    if (!shippingAddress.firstName || !shippingAddress.address1) {
        toast.error("Please fill in shipping address.");
        setLoading(false);
        return;
    }

    if (!isSameBilling && (!finalBillingAddress.firstName || !finalBillingAddress.address1)) {
        toast.error("Please fill in billing address.");
        setLoading(false);
        return;
    }

    if (!selectedShippingMethod) {
        toast.error("Please select a shipping method.");
        setLoading(false);
        return;
    }
    
    // Guest Info
    const guestInfo = !user ? {
        email: guestEmail, 
        name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        phone: shippingAddress.phone
    } : undefined;

    // 🔥 Call Server Action with Totals (Including Surcharge)
    const res = await processCheckout({
        cartId: cartId!,
        userId: user?.id, 
        guestInfo: guestInfo,
        
        shippingAddress,
        billingAddress: finalBillingAddress,
        
        paymentMethod: methodConfig.identifier,
        
        shippingData: {
            method: selectedShippingMethod.type,
            carrier: selectedShippingMethod.name,
            cost: selectedShippingMethod.price,
            methodId: selectedShippingMethod.id 
        },
        
        couponCode: couponCode || undefined,
        totals: { ...totals } // 🔥 Pass full totals object
    });

    if (res.success) {
        toast.success("Order placed successfully!");
        router.push(`/checkout/success/${res.orderId}`);
    } else {
        toast.error(res.error || "Failed to place order.");
        setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Instructions Box */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed">
         <h4 className="font-semibold text-gray-900 mb-2">{methodConfig.name} Instructions:</h4>
         <div dangerouslySetInnerHTML={{ __html: methodConfig.instructions || "Please follow the instructions to complete your payment." }} />
         
         {/* Bank Details Table */}
         {methodConfig.identifier === "bank_transfer" && methodConfig.offlineConfig?.bankDetails && (
            <div className="mt-4 bg-white border rounded overflow-hidden shadow-sm">
                {methodConfig.offlineConfig.bankDetails.map((bank: any, i: number) => (
                    <div key={i} className="p-3 border-b last:border-0 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                            <span className="text-gray-500">Bank Name:</span>
                            <span className="col-span-2 font-medium">{bank.bankName}</span>
                            
                            <span className="text-gray-500">Account Name:</span>
                            <span className="col-span-2 font-medium">{bank.accountName}</span>
                            
                            <span className="text-gray-500">Account No:</span>
                            <span className="col-span-2 font-medium font-mono">{bank.accountNumber}</span>
                            
                            {bank.sortCode && (
                                <>
                                    <span className="text-gray-500">BSB / Sort:</span>
                                    <span className="col-span-2 font-medium">{bank.sortCode}</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
         )}
      </div>

      {/* Place Order Button */}
      <Button 
        onClick={handlePlaceOrder} 
        disabled={loading} 
        className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base font-bold shadow-md transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
            <>
                <Loader2 className="animate-spin h-5 w-5" /> Processing...
            </>
        ) : (
            <>
                Place Order <ArrowRight className="h-4 w-4" />
            </>
        )}
      </Button>
    </div>
  );
};