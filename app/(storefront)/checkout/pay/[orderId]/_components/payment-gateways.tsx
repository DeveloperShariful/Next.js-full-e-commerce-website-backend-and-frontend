// File Location: app/checkout/pay/[orderId]/_components/payment-gateways.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, Banknote } from "lucide-react";
import { toast } from "sonner";

interface PaymentGatewaysProps {
  methods: any[]; 
  amount: number;
  currency: string;
  orderId: string;
}

export const PaymentGateways = ({ methods, amount, currency, orderId }: PaymentGatewaysProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setLoading(true);
    toast.info(`Processing payment via ${selectedMethod}...`);

    setTimeout(() => {
        setLoading(false);
        toast.success("Redirecting to gateway...");
    }, 1500);
  };

  const getIcon = (identifier: string) => {
    switch (identifier.toLowerCase()) {
      case "stripe": return <CreditCard className="text-blue-600" />;
      case "paypal": return <Wallet className="text-blue-400" />;
      case "cod": return <Banknote className="text-green-600" />;
      default: return <CreditCard />;
    }
  };

  if (methods.length === 0) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-600 rounded-md text-sm">
        No payment methods available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-3">
        {methods.map((method) => (
          <div key={method.id}>
            <RadioGroupItem
              value={method.identifier}
              id={method.identifier}
              className="peer sr-only" 
            />
            <Label
              htmlFor={method.identifier}
              className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-white hover:border-blue-500 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-blue-600 transition-all"
            >
              <div className="h-10 w-14 bg-slate-50 border rounded flex items-center justify-center shrink-0">
                 {getIcon(method.identifier)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{method.name}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{method.description}</p>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <Button 
        className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 mt-4"
        onClick={handlePayment}
        disabled={loading || !selectedMethod}
      >
        {loading ? "Processing..." : `Pay ${formatMoney(amount)}`}
      </Button>
    </div>
  );
};