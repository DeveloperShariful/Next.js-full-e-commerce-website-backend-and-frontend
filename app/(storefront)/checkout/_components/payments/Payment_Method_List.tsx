// File: app/(storefront)/checkout/_components/payments/Payment_Method_List.tsx

"use client";

import { useEffect } from "react";
import { useCheckoutStore } from "../../useCheckoutStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Landmark, Wallet } from "lucide-react";

export const Payment_Method_List = () => {
  const { settings, selectedPaymentMethod, setPaymentMethod } = useCheckoutStore();
  const methods = settings?.paymentMethods || [];

  // Auto-select first method if none selected
  useEffect(() => {
    if (!selectedPaymentMethod && methods.length > 0) {
        setPaymentMethod(methods[0].identifier);
    }
  }, [methods, selectedPaymentMethod, setPaymentMethod]);

  if (methods.length === 0) {
    return (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
            No payment methods available.
        </div>
    );
  }

  return (
    <RadioGroup 
        value={selectedPaymentMethod || ""} 
        onValueChange={setPaymentMethod}
        className="space-y-3"
    >
      {methods.map((method: any) => {
        const isSelected = selectedPaymentMethod === method.identifier;
        
        return (
            <label 
                key={method.id} 
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                    ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600 shadow-sm" 
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
                <RadioGroupItem value={method.identifier} id={method.identifier} className="mr-3 text-blue-600" />
                
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon Logic */}
                        <div className={`p-2 rounded-md ${isSelected ? "bg-white text-blue-600 shadow-sm" : "bg-gray-100 text-gray-500"}`}>
                            {method.identifier === 'stripe' && <CreditCard size={20} />}
                            {method.identifier === 'paypal' && <Wallet size={20} />}
                            {method.identifier === 'cod' && <Banknote size={20} />}
                            {method.identifier === 'bank_transfer' && <Landmark size={20} />}
                            {['cheque', 'other'].includes(method.identifier) && <Banknote size={20} />}
                        </div>
                        
                        <div>
                            <Label htmlFor={method.identifier} className="text-sm font-semibold text-gray-900 cursor-pointer block">
                                {method.name}
                            </Label>
                            {method.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {method.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </label>
        );
      })}
    </RadioGroup>
  );
};