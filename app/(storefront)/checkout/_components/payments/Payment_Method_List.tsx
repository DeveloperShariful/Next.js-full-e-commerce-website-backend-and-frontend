"use client";

import { useEffect, useMemo } from "react";
import { useCheckoutStore } from "../../useCheckoutStore";
// ✅ FIX: RadioGroupItem ইম্পোর্ট করা হয়েছে
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Banknote, Landmark, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export const Payment_Method_List = () => {
  const { settings, selectedPaymentMethod, setPaymentMethod, totals } = useCheckoutStore();
  const dbMethods = settings?.paymentMethods || [];
  const currentTotal = totals.total || totals.subtotal;

  // 🔥 CORE LOGIC: Transform DB Methods into User Friendly Options
  const displayOptions = useMemo(() => {
    let options: any[] = [];

    dbMethods.forEach((method: any) => {
        // Validation: Min/Max Order Amount
        const min = method.minOrderAmount || 0;
        const max = method.maxOrderAmount || Infinity;
        if (currentTotal < min || currentTotal > max) return;

        // 1. STRIPE SPLIT LOGIC
        if (method.identifier === 'stripe') {
            const config = method.stripeConfig || {};
            
            // A. Credit Card Option
            options.push({
                id: 'stripe_card',
                gatewayId: 'stripe',
                name: "Credit / Debit Card",
                description: "Pay securely with Visa, Mastercard, Amex.",
                icon: CreditCard,
                surcharge: method.surchargeEnabled ? method.surchargeAmount : 0,
                surchargeType: method.surchargeType
            });

            // B. BNPL Options (If enabled in admin)
            if (config.afterpayEnabled) {
                options.push({
                    id: 'stripe_afterpay',
                    gatewayId: 'stripe',
                    name: "Afterpay",
                    description: "Buy now, pay later in 4 installments.",
                    icon: null, 
                    surcharge: method.surchargeEnabled ? method.surchargeAmount : 0,
                    surchargeType: method.surchargeType
                });
            }
            
            if (config.klarnaEnabled) {
                options.push({
                    id: 'stripe_klarna',
                    gatewayId: 'stripe',
                    name: "Klarna",
                    description: "Flexible payment options.",
                    icon: null,
                    surcharge: method.surchargeEnabled ? method.surchargeAmount : 0,
                    surchargeType: method.surchargeType
                });
            }
        } 
        
        // 2. PAYPAL LOGIC
        else if (method.identifier === 'paypal') {
            options.push({
                id: 'paypal',
                gatewayId: 'paypal',
                name: "PayPal",
                description: "Pay via PayPal, Pay Later or Card.",
                icon: Wallet,
                surcharge: method.surchargeEnabled ? method.surchargeAmount : 0,
                surchargeType: method.surchargeType
            });
        }
        
        // 3. OFFLINE METHODS
        else {
            let Icon = Banknote;
            if (method.identifier === 'bank_transfer') Icon = Landmark;
            
            options.push({
                id: method.identifier,
                gatewayId: method.identifier,
                name: method.name,
                description: method.description,
                icon: Icon,
                surcharge: method.surchargeEnabled ? method.surchargeAmount : 0,
                surchargeType: method.surchargeType
            });
        }
    });

    return options;
  }, [dbMethods, currentTotal]);

  // Auto-select first option
  useEffect(() => {
    if (!selectedPaymentMethod && displayOptions.length > 0) {
        setPaymentMethod(displayOptions[0].id);
    }
  }, [displayOptions, selectedPaymentMethod, setPaymentMethod]);

  if (displayOptions.length === 0) {
    return (
        <div className="text-sm text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
            No payment methods available for this order amount.
        </div>
    );
  }

  return (
    <RadioGroup 
        value={selectedPaymentMethod || ""} 
        onValueChange={setPaymentMethod}
        className="space-y-3"
    >
      {displayOptions.map((option) => {
        const isSelected = selectedPaymentMethod === option.id;
        const Icon = option.icon || Banknote;

        return (
            <label 
                key={option.id} 
                className={`group flex items-start p-4 border rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden ${
                    isSelected 
                    ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-sm" 
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
            >
                <div className="flex items-center h-full mr-4">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white group-hover:border-gray-400"
                    }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{option.name}</span>
                            {/* Surcharge Badge */}
                            {option.surcharge > 0 && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                    +{option.surchargeType === 'percentage' ? `${option.surcharge}%` : `$${option.surcharge}`} Fee
                                </span>
                            )}
                        </div>
                        {/* Icon Display */}
                        <div className={`text-gray-400 ${isSelected ? "text-blue-600" : ""}`}>
                            {option.id === 'stripe_card' && (
                                <div className="flex gap-1">
                                  <CreditCard size={20}/>
                                </div>
                            )}
                            {option.id === 'paypal' && <Wallet size={20}/>}
                            {!['stripe_card', 'paypal'].includes(option.id) && <Icon size={20}/>}
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 leading-relaxed">
                        {option.description}
                    </p>
                </div>

                {/* Selected Checkmark */}
                {isSelected && (
                    <div className="absolute top-0 right-0 p-1.5">
                        <CheckCircle2 size={16} className="text-blue-600 fill-blue-50"/>
                    </div>
                )}
                
                {/* Real Input - This was missing the import */}
                <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
            </label>
        );
      })}
    </RadioGroup>
  );
};