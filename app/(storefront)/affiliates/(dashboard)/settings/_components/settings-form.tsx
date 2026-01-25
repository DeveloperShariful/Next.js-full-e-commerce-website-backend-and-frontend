//app/(storefront)/affiliates/settings/_components/settings-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateSettingsAction } from "@/app/actions/storefront/affiliates/mutations/update-settings";

interface Props {
  userId: string;
  initialData: {
    paypalEmail: string;
    bankDetails: any;
  };
}

export default function SettingsForm({ userId, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">PayPal Email</label>
          <input {...register("paypalEmail")} className="w-full border rounded px-3 py-2 text-sm" placeholder="you@example.com" />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Bank Name</label>
          <input {...register("bankName")} className="w-full border rounded px-3 py-2 text-sm" placeholder="Bank Name" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Account Name</label>
          <input {...register("accountName")} className="w-full border rounded px-3 py-2 text-sm" placeholder="Account Holder Name" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Account Number</label>
          <input {...register("accountNumber")} className="w-full border rounded px-3 py-2 text-sm" placeholder="123456789" />
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}