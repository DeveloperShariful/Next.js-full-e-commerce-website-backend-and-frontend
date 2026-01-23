// app/admin/products/create/_components/Shipping.tsx

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getShippingClasses } from "@/app/actions/admin/product/product-read";
import { useGlobalStore } from "@/app/providers/global-store-provider"; // 🔥 Imported
import { ProductFormData } from "../types";

export default function Shipping() {
    const { register, watch } = useFormContext<ProductFormData>();
    const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
    
    // 🔥 Global Units
    const { weightUnit, dimensionUnit } = useGlobalStore();
    const wUnit = weightUnit || "kg";
    const dUnit = dimensionUnit || "cm";

    useEffect(() => {
        getShippingClasses().then(res => { if(res.success) setClasses(res.data as any) });
    }, []);

    return (
        <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-3 gap-4 items-center">
                {/* 🔥 Dynamic Weight Unit */}
                <label className="text-right font-medium text-xs">Weight ({wUnit})</label>
                <input 
                    type="number" 
                    step="0.01"
                    {...register("weight")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    placeholder="0" 
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-start">
                {/* 🔥 Dynamic Dimension Unit */}
                <label className="text-right font-medium text-xs pt-2">Dimensions ({dUnit})</label>
                <div className="col-span-2 flex gap-2">
                    <input 
                        type="number" 
                        placeholder="L" 
                        step="0.01"
                        {...register("length")}
                        className="w-1/3 border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    />
                    <input 
                        type="number" 
                        placeholder="W" 
                        step="0.01"
                        {...register("width")}
                        className="w-1/3 border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    />
                    <input 
                        type="number" 
                        placeholder="H" 
                        step="0.01"
                        {...register("height")}
                        className="w-1/3 border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Shipping class</label>
                <select 
                    {...register("shippingClassId")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="">No shipping class</option>
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <hr className="border-gray-200" />
            <h3 className="text-xs font-bold text-gray-700">International / Customs</h3>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Country of Origin</label>
                <input 
                    {...register("countryOfManufacture")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    placeholder="e.g. Bangladesh" 
                />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">HS Code</label>
                <input 
                    {...register("hsCode")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    placeholder="Harmonized System Code" 
                />
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-start-2 col-span-2">
                    <label className="flex items-center gap-2 text-xs select-none">
                        <input 
                            type="checkbox" 
                            {...register("isDangerousGood")}
                        />
                        This is a dangerous good (e.g. Battery, Chemical)
                    </label>
                </div>
            </div>
        </div>
    );
}