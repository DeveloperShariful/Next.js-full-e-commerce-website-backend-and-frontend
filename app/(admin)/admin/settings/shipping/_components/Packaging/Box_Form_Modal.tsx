// File: app/admin/settings/shipping/_components/Packaging/Box_Form_Modal.tsx

"use client";

import { useState } from "react";
import { saveShippingBox } from "@/app/actions/admin/settings/shipping/packaging";
import { ShippingBox } from "@prisma/client";
import { X, Loader2, Save } from "lucide-react";
import { toast } from "react-hot-toast";

interface BoxFormProps {
    box: ShippingBox | null;
    onClose: () => void;
    refreshData: () => void;
}

export default function Box_Form_Modal({ box, onClose, refreshData }: BoxFormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        if (box) {
            formData.append("id", box.id);
        }

        const res = await saveShippingBox(formData);
        
        if (res.success) {
            toast.success(res.message || "Box saved successfully");
            refreshData();
            onClose();
        } else {
            toast.error(res.error || "Failed to save box");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-800">
                        {box ? "Edit Box" : "Add New Box"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Box Name / Reference <span className="text-red-500">*</span>
                        </label>
                        <input 
                            name="name" 
                            required 
                            defaultValue={box?.name || ""}
                            placeholder="e.g. Small Parcel Box, Satchel 500g" 
                            className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Length (cm) *</label>
                            <input 
                                name="length" 
                                type="number" 
                                step="0.1" 
                                required 
                                // ✅ FIX: Convert Decimal to string/number
                                defaultValue={box?.length ? Number(box.length) : ""}
                                placeholder="0.0" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Width (cm) *</label>
                            <input 
                                name="width" 
                                type="number" 
                                step="0.1" 
                                required 
                                // ✅ FIX: Convert Decimal to string/number
                                defaultValue={box?.width ? Number(box.width) : ""}
                                placeholder="0.0" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Height (cm) *</label>
                            <input 
                                name="height" 
                                type="number" 
                                step="0.1" 
                                required 
                                // ✅ FIX: Convert Decimal to string/number
                                defaultValue={box?.height ? Number(box.height) : ""}
                                placeholder="0.0" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Max Weight (kg)
                            </label>
                            <input 
                                name="maxWeight" 
                                type="number" 
                                step="0.001" 
                                // ✅ FIX: Convert Decimal to string/number
                                defaultValue={box?.maxWeight ? Number(box.maxWeight) : ""}
                                placeholder="Optional" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                            <p className="text-xs text-slate-500 mt-1">Maximum load this box can handle.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Empty Box Weight (kg)
                            </label>
                            <input 
                                name="weight" 
                                type="number" 
                                step="0.001" 
                                // ✅ FIX: Convert Decimal to string/number
                                defaultValue={box?.weight ? Number(box.weight) : 0}
                                placeholder="0.0" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                            <p className="text-xs text-slate-500 mt-1">Weight of the packaging material itself.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3 border-t mt-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 border border-slate-300 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#2271b1] text-white rounded-md text-sm font-bold hover:bg-[#135e96] disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                            {box ? "Save Changes" : "Add Box"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}