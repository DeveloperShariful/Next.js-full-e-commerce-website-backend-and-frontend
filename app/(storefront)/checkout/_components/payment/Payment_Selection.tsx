// File: app/(storefront)/checkout/_components/payment/Payment_Selection.tsx

"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Banknote, Building2, Wallet } from "lucide-react";
import Image from "next/image";

// Sub Components Imports
import { Offline_Payment_Info } from "./gateways/Offline_Payment_Info";
import { Stripe_Wrapper } from "./gateways/Stripe_Wrapper";
import { Paypal_Wrapper } from "./gateways/Paypal_Wrapper";

interface Props {
  methods: any[]; // Payment Methods from DB
  cartId: string;
  currencySymbol?: string; // e.g. AUD
}

export const Payment_Selection = ({ methods, cartId, currencySymbol = "AUD" }: Props) => {
  const { setValue } = useFormContext();
  
  const selectedMethod = useWatch({
    name: "paymentMethod"
  });

  // আইকন হেল্পার
  const getIcon = (identifier: string) => {
    switch (identifier) {
      case "stripe": return <CreditCard className="w-5 h-5 text-[#635BFF]" />;
      case "paypal": return <Wallet className="w-5 h-5 text-[#003087]" />;
      case "cod": return <Banknote className="w-5 h-5 text-green-600" />;
      case "bank_transfer": return <Building2 className="w-5 h-5 text-gray-600" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <RadioGroup
          onValueChange={(val) => setValue("paymentMethod", val)}
          className="space-y-4"
        >
          {methods.map((method) => {
            const isSelected = selectedMethod === method.identifier;

            return (
              <div key={method.id} className={`border rounded-lg transition-all ${isSelected ? "border-primary ring-1 ring-primary bg-blue-50/10" : "border-gray-200 hover:border-gray-300"}`}>
                
                {/* Header (Always Visible) */}
                <Label htmlFor={method.identifier} className="flex items-center gap-4 p-4 cursor-pointer w-full">
                  <RadioGroupItem value={method.identifier} id={method.identifier} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getIcon(method.identifier)}
                      <span className="font-semibold text-gray-900">{method.name}</span>
                    </div>
                  </div>

                  {/* Badges / Icons */}
                  {method.identifier === "stripe" && (
                    <div className="flex gap-1">
                      <Image src="/icons/visa.svg" width={32} height={20} alt="Visa" className="h-5 w-auto" />
                      <Image src="/icons/mastercard.svg" width={32} height={20} alt="Mastercard" className="h-5 w-auto" />
                    </div>
                  )}
                  {method.identifier === "paypal" && (
                     <Image src="/icons/paypal.svg" width={60} height={20} alt="PayPal" className="h-5 w-auto" />
                  )}
                </Label>

                {/* Body (Conditional Rendering based on Selection) */}
                {isSelected && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    
                    {/* STRIPE */}
                    {method.identifier === "stripe" && (
                      <Stripe_Wrapper cartId={cartId} />
                    )}

                    {/* PAYPAL */}
                    {method.identifier === "paypal" && (
                      <Paypal_Wrapper 
                        cartId={cartId} 
                        settings={method.paypalConfig} 
                        currency={currencySymbol} 
                      />
                    )}

                    {/* OFFLINE (COD, BANK, CHEQUE) */}
                    {["cod", "bank_transfer", "cheque"].includes(method.identifier) && (
                      <Offline_Payment_Info method={method} />
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};