// File: app/admin/settings/shipping/_components/Local/Shipping_Classes.tsx

"use client";

import { useState } from "react";
import { createShippingClass, deleteShippingClass } from "@/app/actions/backend/settings/shipping/local";
import { ComponentProps } from "./types";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function Shipping_Classes({ classes, refreshData }: ComponentProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        const res = await createShippingClass(formData);
        if (res.success) {
            toast.success("Shipping class created");
            setIsModalOpen(false);
            refreshData();
        } else {
            toast.error("Failed to create class");
        }
    };

    const handleDeleteClass = async (id: string) => {
        if(confirm("Remove this shipping class? Products using this class will revert to default.")) {
            await deleteShippingClass(id);
            refreshData();
        }
    };

    // WP Input Class Helper for Modal
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    return (
        <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in mb-[30px]">
            
            {/* WP Page Title & Action */}
            <div className="flex items-center gap-3 mb-[15px]">
                <h2 className="text-[23px] font-normal text-[#1d2327] m-0">Shipping Classes</h2>
                <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[10px] py-[2px] text-[13px] font-semibold cursor-pointer"
                >
                    Add shipping class
                </button>
            </div>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">Shipping classes can be used to group products of similar type to provide different rates, e.g., "Heavy" or "Bulky".</p>

            {/* WP List Table */}
            <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Class Name</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Slug</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Description</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] text-center">Product Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-[10px] py-[20px] text-center text-[#646970] italic">
                                    No shipping classes found.
                                </td>
                            </tr>
                        ) : classes.map((cls, index) => (
                            <tr key={cls.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] group ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                <td className="px-[10px] py-[10px] align-top">
                                    <strong className="text-[#2271b1] block text-[13px]">{cls.name}</strong>
                                    
                                    {/* WP Row Actions (Hover to reveal) */}
                                    <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleDeleteClass(cls.id)}
                                            className="bg-transparent border-none text-[#d63638] hover:underline cursor-pointer p-0"
                                        >
                                            Trash
                                        </button>
                                    </div>
                                </td>
                                <td className="px-[10px] py-[10px] text-[#646970] font-mono text-[11px] align-top">
                                    {cls.slug}
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a] align-top">
                                    {cls.description || "—"}
                                </td>
                                <td className="px-[10px] py-[10px] text-center align-top">
                                    <span className="text-[#646970] font-semibold bg-[#f0f0f1] border border-[#dcdcde] px-[8px] py-[2px] rounded-[3px]">
                                        {cls._count?.products || 0}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- WP STYLE MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#000000b3] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#f0f0f1] shadow-md w-full max-w-md flex flex-col font-sans text-[13px] text-[#3c434a]">
                        
                        <div className="flex justify-between items-center px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white shrink-0">
                            <h3 className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">
                                Add Shipping Class
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="bg-white p-[20px] overflow-y-auto flex-1">
                            <form id="class-form" onSubmit={handleCreateClass} className="space-y-[15px]">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Name</label>
                                    <input name="name" required placeholder="e.g. Heavy" className={wpInputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Slug</label>
                                    <input name="slug" required placeholder="e.g. heavy" className={wpInputClass} />
                                    <p className="text-[11px] text-[#646970] mt-1 mb-0">Must be unique and contain only lowercase letters, numbers, and hyphens.</p>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Description</label>
                                    <textarea name="description" rows={3} className={`${wpInputClass} !h-auto py-2`} />
                                </div>
                            </form>
                        </div>

                        <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
                            <button 
                                type="button" onClick={() => setIsModalOpen(false)} 
                                className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" form="class-form" 
                                className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm min-h-[30px]"
                            >
                                Save Shipping Class
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}