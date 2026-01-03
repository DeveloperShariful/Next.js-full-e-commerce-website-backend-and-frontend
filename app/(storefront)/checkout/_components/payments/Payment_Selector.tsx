// File: app/(storefront)/checkout/_components/payments/Payment_Selector.tsx

"use client";

import { useEffect } from "react";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Landmark } from "lucide-react";

// Sub-components
import { Offline_Info } from "./Offline_Info";
import { PayPal_Button } from "./PayPal_Button";
import { Stripe_Wrapper } from "./Stripe_Wrapper";

export const Payment_Selector = () => {
  const { settings, selectedPaymentMethod, setPaymentMethod } = useCheckoutStore();
  
  // 🛠️ DEBUG: কনসোলে চেক করুন (ব্রাউজারে F12 চেপে Console এ দেখুন)
  // যদি এখানে empty array আসে, তার মানে initialize ফাংশনে ডাটা ঢুকছে না
  console.log("Payment Methods in UI:", settings?.paymentMethods);

  const methods = settings?.paymentMethods || [];

  // অটো-সিলেক্ট লজিক
  useEffect(() => {
    if (!selectedPaymentMethod && methods.length > 0) {
        setPaymentMethod(methods[0].identifier);
    }
  }, [methods, selectedPaymentMethod, setPaymentMethod]);

  if (methods.length === 0) {
    return (
        <div className="p-4 border border-red-200 bg-red-50 rounded text-red-600 text-sm">
            ⚠️ No payment methods configured. Please verify Admin Settings or Database.
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <RadioGroup 
        value={selectedPaymentMethod || ""} 
        onValueChange={setPaymentMethod}
        className="space-y-3"
      >
        {methods.map((method: any) => {
            const isSelected = selectedPaymentMethod === method.identifier;
            
            return (
                <div key={method.id} className={`border rounded-lg transition-all overflow-hidden ${isSelected ? "border-blue-600 ring-1 ring-blue-600 bg-white" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    
                    {/* Header */}
                    <div className="flex items-center p-4 cursor-pointer" onClick={() => setPaymentMethod(method.identifier)}>
                        <RadioGroupItem value={method.identifier} id={method.identifier} className="mr-3" />
                        <Label htmlFor={method.identifier} className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                            {method.identifier === 'stripe' && <CreditCard className="h-4 w-4 text-blue-600" />}
                            {method.identifier === 'cod' && <Banknote className="h-4 w-4 text-green-600" />}
                            {method.identifier === 'bank_transfer' && <Landmark className="h-4 w-4 text-gray-600" />}
                            {method.name}
                        </Label>
                    </div>

                    {/* Body */}
                    {isSelected && (
                        <div className="p-4 border-t bg-gray-50/50 animate-in slide-in-from-top-1">
                            {method.identifier === "paypal" && <PayPal_Button methodConfig={method} />}
                            {method.identifier === "stripe" && <Stripe_Wrapper methodConfig={method} />}
                            {["cod", "bank_transfer", "cheque"].includes(method.identifier) && <Offline_Info methodConfig={method} />}
                        </div>
                    )}
                </div>
            );
        })}
      </RadioGroup>
    </div>
  );
};