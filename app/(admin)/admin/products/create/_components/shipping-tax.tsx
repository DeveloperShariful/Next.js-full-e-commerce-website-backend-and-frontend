// app/admin/products/create/_components/shipping-tax.tsx

import { useFormContext } from "react-hook-form";
import { ProductFormData } from "../types";

export function ShippingTax() {
  const { register, watch, setValue } = useFormContext<ProductFormData>();
  const isVirtual = watch("isVirtual");
  const weight = watch("weight");
  const length = watch("length");
  const width = watch("width");
  const height = watch("height");

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="font-bold text-lg text-slate-800 border-b pb-3">Shipping & Delivery</h3>

      <div className="flex gap-6 mb-4">
         <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              {...register("isVirtual")}
              className="rounded text-blue-600"
            />
            This is a digital product
         </label>
      </div>

      {!isVirtual && (
        <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                <input 
                    type="number" 
                    step="0.01"
                    {...register("weight")}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="0.0"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Length (cm)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("length")}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Width (cm)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("width")}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Height (cm)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("height")}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}