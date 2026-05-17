// app/admin/products/create/_components/Shipping.tsx

"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getShippingClasses } from "@/app/actions/backend/product/product-read";
import { useGlobalStore } from "@/app/providers/global-store-provider"; 
import { ProductFormData } from "../types";

export default function Shipping() {
    const { register } = useFormContext<ProductFormData>();
    const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
    
    // Global Units
    const { weightUnit, dimensionUnit } = useGlobalStore();
    const wUnit = weightUnit || "kg";
    const dUnit = dimensionUnit || "cm";

    useEffect(() => {
        getShippingClasses().then(res => { if(res.success) setClasses(res.data as any) });
    }, []);

    return (
        <div className="space-y-4 max-w-2xl">
            {/* Weight */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="md:text-left text-[13px] text-[#3c434a]">Weight ({wUnit})</label>
                <input 
                    type="number" 
                    step="0.01"
                    {...register("weight")}
                    className="md:col-span-2 w-full md:w-1/2 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                    placeholder="0" 
                />
            </div>
            
            {/* Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <label className="md:text-left text-[13px] text-[#3c434a] pt-1.5">Dimensions ({dUnit})</label>
                <div className="md:col-span-3 flex gap-2">
                    <input 
                        type="number" 
                        placeholder="Length" 
                        step="0.01"
                        {...register("length")}
                        className="w-1/3 md:w-24 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                    />
                    <input 
                        type="number" 
                        placeholder="Width" 
                        step="0.01"
                        {...register("width")}
                        className="w-1/3 md:w-24 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                    />
                    <input 
                        type="number" 
                        placeholder="Height" 
                        step="0.01"
                        {...register("height")}
                        className="w-1/3 md:w-24 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                    />
                </div>
            </div>
            
            {/* Shipping Class */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4">
                <label className="md:text-left text-[13px] text-[#3c434a]">Shipping class</label>
                <div className="md:col-span-2">
                    <select 
                        {...register("shippingClassId")}
                        className="w-full md:w-3/4 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                    >
                        <option value="">No shipping class</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* International / Customs */}
            <div className="pt-2 space-y-4">
                <h3 className="text-[14px] font-semibold text-[#1d2327] mb-2">International / Customs</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="md:text-left text-[13px] text-[#3c434a]">Country of Origin</label>
                    <input 
                        {...register("countryOfManufacture")}
                        className="md:col-span-2 w-full md:w-3/4 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                        placeholder="e.g. BD, AU, CN" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <label className="md:text-left text-[13px] text-[#3c434a]">HS Code</label>
                    <input 
                        {...register("hsCode")}
                        className="md:col-span-2 w-full md:w-3/4 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                        placeholder="Harmonized System Code" 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mt-2">
                    <div className="md:col-start-2 md:col-span-3">
                        <label className="flex items-center gap-2 text-[13px] text-[#3c434a] select-none cursor-pointer">
                            <input 
                                type="checkbox" 
                                {...register("isDangerousGood")}
                                className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#d63638] focus:ring-[#d63638]"
                            />
                            This is a dangerous good (e.g. Battery, Chemical)
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}