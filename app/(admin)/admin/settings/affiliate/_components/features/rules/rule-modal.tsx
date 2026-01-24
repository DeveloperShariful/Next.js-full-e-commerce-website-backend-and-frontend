// File: app/(admin)/admin/settings/affiliate/_components/features/rules/rule-modal.tsx

"use client";

import { useForm, Controller } from "react-hook-form";
import { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2, Save, Plus, Calculator  } from "lucide-react";
import { AffiliateCommissionRule } from "@prisma/client";

import { upsertRule } from "@/app/actions/admin/settings/affiliate/mutations/manage-rules";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AffiliateCommissionRule | null;
}

// Logic Builder structure mapped to UI
interface RuleFormValues {
  id?: string;
  name: string;
  isActive: boolean;
  priority: number;
  
  // Action
  actionType: "PERCENTAGE" | "FIXED";
  actionValue: number;
  
  // Dates
  startDate?: string;
  endDate?: string;

  // Logic Conditions (Flattened for UI)
  minOrderAmount?: number;
  customerType?: "ALL" | "NEW" | "RETURNING";
  requiredCategoryIds?: string; // Comma separated for simplicity in this demo
}

export default function RuleModal({ isOpen, onClose, initialData }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RuleFormValues>({
    defaultValues: {
      name: "",
      isActive: true,
      priority: 0,
      actionType: "PERCENTAGE",
      actionValue: 0,
      customerType: "ALL",
    },
  });

  // Hydrate form on edit
  useEffect(() => {
    if (initialData) {
      const action = initialData.action as any;
      const conditions = initialData.conditions as any;
      
      form.reset({
        id: initialData.id,
        name: initialData.name,
        isActive: initialData.isActive,
        priority: initialData.priority,
        actionType: action?.type || "PERCENTAGE",
        actionValue: action?.value || 0,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : undefined,
        
        // Map JSON logic back to UI fields
        minOrderAmount: conditions?.minOrderAmount || undefined,
        customerType: conditions?.customerType || "ALL",
        requiredCategoryIds: conditions?.categoryIds?.join(",") || "",
      });
    } else {
      form.reset({
        name: "",
        isActive: true,
        priority: 0,
        actionType: "PERCENTAGE",
        actionValue: 0,
        customerType: "ALL",
      });
    }
  }, [initialData, form, isOpen]);

  const onSubmit = (data: RuleFormValues) => {
    // 1. Construct the JSON Logic Object
    const conditions: Record<string, any> = {};
    
    // Only add conditions if they are set
    if (data.minOrderAmount && data.minOrderAmount > 0) {
      conditions.minOrderAmount = data.minOrderAmount;
    }
    if (data.customerType && data.customerType !== "ALL") {
      conditions.customerType = data.customerType;
    }
    if (data.requiredCategoryIds) {
      conditions.categoryIds = data.requiredCategoryIds.split(",").map(s => s.trim()).filter(Boolean);
    }
    
    // Fallback if no condition set (just to pass validation, though logic implies always true)
    if (Object.keys(conditions).length === 0) {
      conditions.alwaysTrue = true;
    }

    // 2. Prepare Payload
    const payload: any = {
      id: data.id,
      name: data.name,
      isActive: data.isActive,
      priority: data.priority,
      conditions: conditions, // Pass the constructed JSON
      action: {
        type: data.actionType,
        value: data.actionValue,
      },
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      affiliateSpecificIds: [],
    };

    startTransition(async () => {
      const result = await upsertRule(payload);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Logic Rule" : "Create Logic Rule"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6">
          <form id="rule-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1 space-y-2">
                <label className="text-sm font-medium text-gray-700">Rule Name</label>
                <input
                  {...form.register("name", { required: "Name is required" })}
                  placeholder="e.g. Black Friday Boost"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
                {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <input
                  type="number"
                  {...form.register("priority")}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                />
                <p className="text-[10px] text-gray-500">Higher number runs first.</p>
              </div>
            </div>

            {/* 2. Logic Builder (Conditions) */}
            <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Trigger Conditions (IF)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Type</label>
                  <select
                    {...form.register("customerType")}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="ALL">Any Customer</option>
                    <option value="NEW">New Customer Only</option>
                    <option value="RETURNING">Returning Customer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Min. Order Value ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    {...form.register("minOrderAmount")}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Specific Categories (IDs)</label>
                  <input
                    type="text"
                    placeholder="e.g. cat_123, cat_456 (Leave empty for all)"
                    {...form.register("requiredCategoryIds")}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                  <p className="text-[10px] text-gray-500">Comma separated category IDs.</p>
                </div>
              </div>
            </div>

            {/* 3. Action (Reward) */}
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-100 space-y-4">
              <h4 className="text-sm font-semibold text-blue-900">Reward (THEN)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Commission Type</label>
                  <select
                    {...form.register("actionType")}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register("actionValue", { min: 0, required: true })}
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. Schedule & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...form.register("startDate")}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  {...form.register("endDate")}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isActive"
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" 
                {...form.register("isActive")} 
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                Rule is Active
              </label>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="rule-form"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {initialData ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}