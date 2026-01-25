//app/(storefront)/affiliates/finance/payouts/_components/payout-request-modal.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, DollarSign, X, Check, Building2, CreditCard, ShoppingBag } from "lucide-react";
import { requestPayoutAction } from "@/app/actions/storefront/affiliates/mutations/request-payout";
import { PayoutMethod } from "@prisma/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  config: {
    minimumPayout: number;
    payoutMethods: string[];
  };
}

interface FormValues {
  amount: number;
  method: PayoutMethod;
}

export default function PayoutRequestModal({ isOpen, onClose, userId, balance, config }: Props) {
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

  const getMethodIcon = (m: string) => {
    if (m === "BANK_TRANSFER") return <Building2 className="w-5 h-5 text-gray-500" />;
    if (m === "PAYPAL") return <CreditCard className="w-5 h-5 text-blue-500" />;
    return <ShoppingBag className="w-5 h-5 text-purple-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">Request Withdrawal</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* Balance Card */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Available Balance</span>
            <span className="text-xl font-bold text-gray-900">${balance.toFixed(2)}</span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Amount to Withdraw</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                {...register("amount", { 
                  min: { value: config.minimumPayout, message: `Minimum withdrawal is $${config.minimumPayout}` },
                  max: { value: balance, message: "Amount exceeds balance" },
                  required: "Amount is required"
                })}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-lg font-semibold focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 font-medium">{errors.amount.message}</p>}
          </div>

          {/* Methods */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payout Method</label>
            <div className="grid grid-cols-1 gap-2">
              {config.payoutMethods.map((m) => (
                <label 
                  key={m} 
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedMethod === m ? "border-black bg-gray-50 ring-1 ring-black" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getMethodIcon(m)}
                    <span className="text-sm font-medium capitalize">{m.replace("_", " ").toLowerCase()}</span>
                  </div>
                  <input 
                    type="radio" 
                    value={m} 
                    {...register("method")} 
                    className="w-4 h-4 text-black focus:ring-black"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
            Note: Payouts are processed within <b>{config.minimumPayout === 0 ? "24 hours" : "1-3 business days"}</b>.
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isPending || balance < config.minimumPayout}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Confirm Withdrawal
          </button>

        </form>
      </div>
    </div>
  );
}