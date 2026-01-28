//app/(storefront)/affiliates/_components/settings-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, CreditCard, Building2, Code2, Plus, Trash2 } from "lucide-react";
import { updateSettingsAction, addPixelAction } from "@/app/actions/storefront/affiliates/mutations/update-settings";

interface Props {
  userId: string;
  initialData: {
    paypalEmail: string;
    bankDetails: any;
    pixels?: any[]; // Optional if passed
  };
}

export default function SettingsForm({ userId, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  
  // Forms
  const { register, handleSubmit } = useForm({
    defaultValues: {
      paypalEmail: initialData.paypalEmail,
      bankName: initialData.bankDetails?.bankName || "",
      accountName: initialData.bankDetails?.accountName || "",
      accountNumber: initialData.bankDetails?.accountNumber || "",
    }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const payload = {
        userId,
        paypalEmail: data.paypalEmail,
        bankDetails: {
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
        }
      };

      const res = await updateSettingsAction(payload);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
        
        {/* Payout Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Payout Configuration</h3>
                    <p className="text-xs text-gray-500">Set up where you want to receive your earnings.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PayPal */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                            PayPal Email
                        </label>
                        <input 
                            {...register("paypalEmail")} 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                            placeholder="you@example.com" 
                        />
                    </div>

                    {/* Bank Details */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="md:col-span-3 flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-bold text-gray-700 uppercase">Bank Transfer Details</span>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Bank Name</label>
                            <input {...register("bankName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black outline-none bg-white" placeholder="Bank Name" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Account Holder</label>
                            <input {...register("accountName")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black outline-none bg-white" placeholder="Name on Account" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-gray-500">Account Number / IBAN</label>
                            <input {...register("accountNumber")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-black outline-none bg-white" placeholder="XXXXXXXXX" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button 
                        type="submit" 
                        disabled={isPending}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </form>
        </div>

        {/* Tracking Pixels */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm opacity-90">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Code2 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Conversion Pixels</h3>
                    <p className="text-xs text-gray-500">Fire your own tracking scripts on order success.</p>
                </div>
            </div>
            
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-sm text-gray-500">Pixel management is handled by admins for security.</p>
                <p className="text-xs text-gray-400 mt-1">Please contact support to add your Facebook/Google/TikTok pixels.</p>
            </div>
        </div>

    </div>
  );
}