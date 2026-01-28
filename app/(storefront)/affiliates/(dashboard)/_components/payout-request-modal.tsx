//app/(storefront)/affiliates/_components/payout-request-modal.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, DollarSign, X, Check, Building2, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
import { requestPayoutAction } from "@/app/actions/storefront/affiliates/mutations/request-payout";
import { PayoutMethod } from "@prisma/client";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  config: {
    minimumPayout: number;
    payoutMethods: string[];
  };
  currency: string;
}

interface FormValues {
  amount: number;
  method: PayoutMethod;
}

export default function PayoutRequestModal({ isOpen, onClose, userId, balance, config, currency }: Props) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      amount: config.minimumPayout,
      method: (config.payoutMethods[0] as PayoutMethod) || "STORE_CREDIT"
    }
  });

  const selectedMethod = watch("method");

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await requestPayoutAction({ 
        userId, 
        amount: data.amount, 
        method: data.method 
      });

      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
             <h3 className="text-lg font-bold text-gray-900">Request Withdrawal</h3>
             <p className="text-xs text-gray-500">Transfer earnings to your account</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* Balance Display */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Available Balance</span>
                    <span className="block text-2xl font-bold mt-1">{currency}{balance.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-400" />
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none blur-2xl"></div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Withdraw Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-bold text-gray-400">{currency}</span>
              <input
                type="number"
                step="0.01"
                {...register("amount", { 
                  min: { value: config.minimumPayout, message: `Min: ${currency}${config.minimumPayout}` },
                  max: { value: balance, message: "Exceeds balance" },
                  required: "Amount is required"
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><X className="w-3 h-3"/> {errors.amount.message}</p>}
          </div>

          {/* Method Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Payout Method</label>
            <div className="space-y-2">
              {config.payoutMethods.map((m) => (
                <label 
                  key={m} 
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all",
                    selectedMethod === m ? "border-black bg-gray-50 ring-1 ring-black" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", 
                        m === 'PAYPAL' ? "bg-blue-50 text-blue-600" : m === 'BANK_TRANSFER' ? "bg-gray-100 text-gray-600" : "bg-purple-50 text-purple-600"
                    )}>
                        {m === 'PAYPAL' ? <CreditCard className="w-4 h-4"/> : m === 'BANK_TRANSFER' ? <Building2 className="w-4 h-4"/> : <ShoppingBag className="w-4 h-4"/>}
                    </div>
                    <span className="text-sm font-bold text-gray-900 capitalize">{m.replace("_", " ").toLowerCase()}</span>
                  </div>
                  <input type="radio" value={m} {...register("method")} className="w-4 h-4 text-black focus:ring-black accent-black" />
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 flex gap-2">
            <span className="font-bold">Note:</span> Processing takes 1-3 business days.
          </div>

          <button
            type="submit"
            disabled={isPending || balance < config.minimumPayout}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Request <ArrowRight className="w-4 h-4"/></>}
          </button>

        </form>
      </div>
    </div>
  );
}