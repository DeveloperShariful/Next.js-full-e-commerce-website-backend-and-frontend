// File: app/admin/settings/shipping/_components/Packaging/Box_Form_Modal.tsx

"use client";

import { useState } from "react";
import { saveShippingBox } from "@/app/actions/settings/shipping/packaging";
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
            // ✅ FIXED: Using fallback string (|| "") prevents 'undefined' error
            toast.success(res.message || "Box saved successfully");
            refreshData();
            onClose();
        } else {
            // ✅ FIXED: Using fallback string
            toast.error(res.error || "Failed to save box");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Responsive Width: w-full max-w-lg */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-800">
                        {box ? "Edit Box" : "Add New Box"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Name */}
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

                    {/* Dimensions Grid - Responsive Columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Length (cm) *</label>
                            <input 
                                name="length" 
                                type="number" 
                                step="0.1" 
                                required 
                                defaultValue={box?.length || ""}
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
                                defaultValue={box?.width || ""}
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
                                defaultValue={box?.height || ""}
                                placeholder="0.0" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                    </div>

                    {/* Weights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Max Weight (kg)
                            </label>
                            <input 
                                name="maxWeight" 
                                type="number" 
                                step="0.001" 
                                defaultValue={box?.maxWeight || ""}
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
                                defaultValue={box?.weight || 0}
                                placeholder="0.0" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                            <p className="text-xs text-slate-500 mt-1">Weight of the packaging material itself.</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
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