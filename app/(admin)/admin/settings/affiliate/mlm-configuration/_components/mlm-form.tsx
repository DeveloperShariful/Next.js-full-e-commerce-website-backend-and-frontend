// File: app/(admin)/admin/settings/affiliate/mlm-configuration/_components/mlm-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Save, Plus, Trash2, HelpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface MLMFormValues {
  isEnabled: boolean;
  commissionBasis: "SALES_AMOUNT" | "PROFIT";
  levels: { level: number; rate: number }[];
}

// Mock Mutation (Replace with real one: upsertMlmConfig)
const updateMlmConfigAction = async (data: any) => ({ success: true, message: "MLM Configuration Updated" });

interface Props {
  initialData: {
    isEnabled: boolean;
    maxLevels: number;
    levelRates: Record<string, number>;
    commissionBasis: string;
  };
}

export default function MLMForm({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();

  // Transform Object to Array for Field Array
  const initialLevels = Object.entries(initialData.levelRates).map(([lvl, rate]) => ({
    level: Number(lvl),
    rate: Number(rate)
  })).sort((a, b) => a.level - b.level);

  const form = useForm<MLMFormValues>({
    defaultValues: {
      isEnabled: initialData.isEnabled,
      commissionBasis: initialData.commissionBasis as any,
      levels: initialLevels.length > 0 ? initialLevels : [{ level: 1, rate: 10 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "levels"
  });

  const onSubmit = (data: MLMFormValues) => {
    // Transform Array back to Object/JSON
    const levelRates: Record<string, number> = {};
    data.levels.forEach((l, index) => {
      levelRates[(index + 1).toString()] = l.rate;
    });

    const payload = {
      isEnabled: data.isEnabled,
      maxLevels: data.levels.length,
      commissionBasis: data.commissionBasis,
      levelRates: levelRates
    };

    startTransition(async () => {
      const res = await updateMlmConfigAction(payload);
      if(res.success) toast.success(res.message);
      else toast.error("Failed to update");
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
      
      {/* 1. Master Toggle */}
      <div className={cn("p-6 rounded-xl border transition-all", 
        form.watch("isEnabled") ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Enable Multi-Level Marketing</h3>
            <p className="text-sm text-gray-500 mt-1">
              If enabled, affiliates will earn commissions from sales made by people they referred.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" {...form.register("isEnabled")} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {form.watch("isEnabled") && (
        <div className="animate-in fade-in slide-in-from-top-4 space-y-8">
            
            {/* 2. Basis Config */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Calculation Basis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className={cn("flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                        form.watch("commissionBasis") === "SALES_AMOUNT" ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200"
                    )}>
                        <input type="radio" value="SALES_AMOUNT" {...form.register("commissionBasis")} className="mt-1" />
                        <div>
                            <span className="font-semibold text-gray-900 block">Total Sales Amount</span>
                            <span className="text-xs text-gray-500">Calculate % based on the final order total (excluding shipping/tax).</span>
                        </div>
                    </label>

                    <label className={cn("flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                        form.watch("commissionBasis") === "PROFIT" ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200"
                    )}>
                        <input type="radio" value="PROFIT" {...form.register("commissionBasis")} className="mt-1" />
                        <div>
                            <span className="font-semibold text-gray-900 block">Profit Margin</span>
                            <span className="text-xs text-gray-500">Calculate % based on (Price - Cost). Requires cost price set on products.</span>
                        </div>
                    </label>
                </div>
            </div>

            {/* 3. Level Config (Dynamic) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Level Structure</h4>
                    <button 
                        type="button" 
                        onClick={() => append({ level: fields.length + 1, rate: 0 })}
                        className="text-xs flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-md hover:bg-gray-800"
                    >
                        <Plus className="w-3 h-3" /> Add Level
                    </button>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold text-gray-500 shadow-sm">
                                L{index + 1}
                            </div>
                            
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-700 block mb-1">
                                    {index === 0 ? "Parent (Direct Upline)" : index === 1 ? "Grandparent" : `Upline Level ${index + 1}`}
                                </label>
                                <div className="text-xs text-gray-400">Gets commission when their downline makes a sale.</div>
                            </div>

                            <div className="w-32">
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        {...form.register(`levels.${index}.rate` as const, { required: true, min: 0 })}
                                        className="w-full pl-3 pr-8 py-2 border rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-right"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={() => remove(index)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                                title="Remove Level"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                            No levels configured. MLM is effectively disabled.
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t">
        <button 
            type="submit" 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Network Settings
        </button>
      </div>
    </form>
  );
}