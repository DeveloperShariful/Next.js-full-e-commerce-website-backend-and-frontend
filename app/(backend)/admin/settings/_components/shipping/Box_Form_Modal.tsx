// File: app/admin/settings/shipping/_components/Packaging/Box_Form_Modal.tsx

"use client";

import { useState } from "react";
import { saveShippingBox } from "@/app/actions/backend/settings/shipping/packaging";
import { ShippingBox } from "@prisma/client";
import { X, Loader2 } from "lucide-react";
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

    // WP Standard Input Class
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    return (
        <div className="fixed inset-0 bg-[#000000b3] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* WP Style Flat Modal */}
            <div className="bg-[#f0f0f1] shadow-md w-full max-w-lg max-h-[90vh] flex flex-col font-sans text-[13px] text-[#3c434a]">
                
                {/* Header */}
                <div className="flex justify-between items-center px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white shrink-0">
                    <h3 className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">
                        {box ? "Edit Box" : "Add New Box"}
                    </h3>
                    <button type="button" onClick={onClose} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto bg-white p-[20px] flex-1">
                    <form id="box-form" onSubmit={handleSubmit} className="space-y-[15px]">
                        
                        <div>
                            <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                Box Name / Reference <span className="text-[#d63638]">*</span>
                            </label>
                            <input 
                                name="name" 
                                required 
                                defaultValue={box?.name || ""}
                                placeholder="e.g. Small Parcel Box, Satchel 500g" 
                                className={wpInputClass}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[15px]">
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Length (cm) <span className="text-[#d63638]">*</span></label>
                                <input 
                                    name="length" 
                                    type="number" 
                                    step="0.1" 
                                    required 
                                    defaultValue={box?.length ? Number(box.length) : ""}
                                    placeholder="0.0" 
                                    className={wpInputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Width (cm) <span className="text-[#d63638]">*</span></label>
                                <input 
                                    name="width" 
                                    type="number" 
                                    step="0.1" 
                                    required 
                                    defaultValue={box?.width ? Number(box.width) : ""}
                                    placeholder="0.0" 
                                    className={wpInputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Height (cm) <span className="text-[#d63638]">*</span></label>
                                <input 
                                    name="height" 
                                    type="number" 
                                    step="0.1" 
                                    required 
                                    defaultValue={box?.height ? Number(box.height) : ""}
                                    placeholder="0.0" 
                                    className={wpInputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px]">
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                    Max Weight (kg)
                                </label>
                                <input 
                                    name="maxWeight" 
                                    type="number" 
                                    step="0.001" 
                                    defaultValue={box?.maxWeight ? Number(box.maxWeight) : ""}
                                    placeholder="Optional" 
                                    className={wpInputClass}
                                />
                                <p className="text-[12px] text-[#646970] m-0 mt-1">Maximum load this box can handle.</p>
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                    Empty Box Weight (kg)
                                </label>
                                <input 
                                    name="weight" 
                                    type="number" 
                                    step="0.001" 
                                    defaultValue={box?.weight ? Number(box.weight) : 0}
                                    placeholder="0.0" 
                                    className={wpInputClass}
                                />
                                <p className="text-[12px] text-[#646970] m-0 mt-1">Weight of the packaging material itself.</p>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="box-form"
                        disabled={loading}
                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[30px]"
                    >
                        {loading && <Loader2 size={14} className="animate-spin"/>}
                        {box ? "Save Changes" : "Add Box"}
                    </button>
                </div>

            </div>
        </div>
    );
}