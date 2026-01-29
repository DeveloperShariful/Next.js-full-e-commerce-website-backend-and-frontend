// File: app/(admin)/admin/settings/affiliate/_components/Configuration/mlm-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Save, Plus, Trash2, Loader2, GitGraph, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ✅ Correct Import Path
// ✅ Use Named Import
import { updateMlmConfigAction } from "@/app/actions/admin/settings/affiliates/_services/mlm-service";

interface MLMFormValues {
  isEnabled: boolean;
  commissionBasis: "SALES_AMOUNT" | "PROFIT";
  levels: { level: number; rate: number }[];
}

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
      // ✅ Call Service Method Directly
      const res = await updateMlmConfigAction(payload);
      if(res.success) toast.success(res.message);
      else toast.error("Failed to update");
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl space-y-8 animate-in fade-in">
      
      <div className={cn("p-6 rounded-xl border transition-all shadow-sm flex items-start gap-4", 
        form.watch("isEnabled") ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200"
      )}>
        <div className="p-3 bg-white rounded-lg border shadow-sm text-indigo-600">
            <GitGraph className="w-6 h-6" />
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Multi-Level Marketing (MLM)</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" {...form.register("isEnabled")} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
            <p className={cn("text-sm mt-1", form.watch("isEnabled") ? "text-indigo-700" : "text-gray-500")}>
                {form.watch("isEnabled") 
                    ? "Active. Affiliates earn from their downline's sales." 
                    : "Disabled. Standard single-tier affiliate program."}
            </p>
        </div>
      </div>

      {form.watch("isEnabled") && (
        <div className="space-y-8 animate-in slide-in-from-top-4">
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Commission Basis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={cn("flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:border-indigo-300 relative overflow-hidden group",
                        form.watch("commissionBasis") === "SALES_AMOUNT" ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500" : "border-gray-200"
                    )}>
                        <input type="radio" value="SALES_AMOUNT" {...form.register("commissionBasis")} className="mt-1" />
                        <div className="z-10">
                            <span className="font-bold text-gray-900 block">Total Sales Amount</span>
                            <span className="text-xs text-gray-500">Calculate % based on order subtotal.</span>
                        </div>
                    </label>

                    <label className={cn("flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:border-indigo-300 relative overflow-hidden group",
                        form.watch("commissionBasis") === "PROFIT" ? "border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500" : "border-gray-200"
                    )}>
                        <input type="radio" value="PROFIT" {...form.register("commissionBasis")} className="mt-1" />
                        <div className="z-10">
                            <span className="font-bold text-gray-900 block">Profit Margin</span>
                            <span className="text-xs text-gray-500">Calculate % based on (Price - Cost).</span>
                        </div>
                    </label>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tier Structure</h4>
                    <button 
                        type="button" 
                        onClick={() => append({ level: fields.length + 1, rate: 0 })}
                        className="text-xs flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all shadow-sm"
                    >
                        <Plus className="w-3 h-3" /> Add Level
                    </button>
                </div>

                <div className="space-y-3 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-indigo-100 before:-z-10">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:border-indigo-200 group">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shadow-sm z-10">
                                {index + 1}
                            </div>
                            
                            <div className="flex-1">
                                <label className="text-xs font-bold text-gray-800 block mb-0.5">
                                    {index === 0 ? "Direct Parent" : `Upline Level ${index + 1}`}
                                </label>
                                <div className="text-[10px] text-gray-400">
                                    {index === 0 ? "Receives commission from direct referrals." : "Receives commission from sub-affiliates."}
                                </div>
                            </div>

                            <div className="w-32">
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        {...form.register(`levels.${index}.rate` as const, { required: true, min: 0 })}
                                        className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-right transition-all"
                                    />
                                    <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={() => remove(index)}
                                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Level"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 flex flex-col items-center">
                            <Layers className="w-10 h-10 mb-2 opacity-20"/>
                            <p>No levels configured. MLM is currently inactive.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button 
            type="submit" 
            disabled={isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:scale-100"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Network Settings
        </button>
      </div>
    </form>
  );
}