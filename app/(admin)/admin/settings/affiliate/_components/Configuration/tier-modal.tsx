// File: app/(admin)/admin/settings/affiliate/tiers/_components/Configuration/tier-modal.tsx

"use client";

import { useForm } from "react-hook-form";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2, Save } from "lucide-react";
import { AffiliateTier, CommissionType } from "@prisma/client";

// ✅ CORRECTED IMPORT
import { upsertTierAction } from "@/app/actions/admin/settings/affiliates/_services/tier-service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliateTier | null;
}

interface FormValues {
  id?: string;
  name: string;
  commissionRate: number;
  commissionType: CommissionType;
  minSalesAmount: number;
  minSalesCount: number;
  color: string;
}

export default function TierModal({ isOpen, onClose, initialData }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      commissionRate: 10,
      commissionType: "PERCENTAGE",
      minSalesAmount: 0,
      minSalesCount: 0,
      color: "#2271b1",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id,
        name: initialData.name,
        commissionRate: Number(initialData.commissionRate),
        commissionType: initialData.commissionType,
        minSalesAmount: Number(initialData.minSalesAmount),
        minSalesCount: initialData.minSalesCount,
        color: initialData.color || "#2271b1",
      });
    } else {
      form.reset({
        name: "",
        commissionRate: 10,
        commissionType: "PERCENTAGE",
        minSalesAmount: 0,
        minSalesCount: 0,
        color: "#2271b1",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      // ✅ Using Service Method Directly
      const result = await upsertTierAction(data);
      if (result.success) {
        toast.success(result.message);
        onClose();
        // In a real app, trigger a refresh or cache invalidation here
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Tier" : "Create New Tier"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-sm font-medium text-gray-700">Tier Name</label>
              <input
                {...form.register("name", { required: "Name is required" })}
                placeholder="e.g. Gold Partner"
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
              {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <input
                type="color"
                {...form.register("color")}
                className="w-full h-[38px] p-1 border rounded-md cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Commission Rate</label>
              <input
                type="number"
                step="0.01"
                {...form.register("commissionRate", { min: 0, required: true })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                {...form.register("commissionType")}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />
          
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry Requirements</h4>
            <p className="text-xs text-gray-400">Affiliates are auto-promoted when they hit these targets.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Min. Sales Amount ($)</label>
              <input
                type="number"
                {...form.register("minSalesAmount")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Min. Sales Count</label>
              <input
                type="number"
                {...form.register("minSalesCount")}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {initialData ? "Update Tier" : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}