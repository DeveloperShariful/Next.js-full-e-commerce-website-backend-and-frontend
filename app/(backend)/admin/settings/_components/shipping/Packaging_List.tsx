// File: app/admin/settings/shipping/_components/Packaging/Packaging_List.tsx

"use client";

import { useState } from "react";
import { deleteShippingBox, toggleBoxStatus } from "@/app/actions/backend/settings/shipping/packaging";
import { ShippingBox, TransdirectBox } from "@prisma/client"; 
import { toast } from "sonner";
import Box_Form_Modal from "./Box_Form_Modal";

interface PackagingListProps {
    shippingBoxes: ShippingBox[];
    transdirectBoxes: TransdirectBox[]; 
    refreshData: () => void;
}

export default function Packaging_List({ shippingBoxes, transdirectBoxes, refreshData }: PackagingListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBox, setEditingBox] = useState<ShippingBox | null>(null);

    // --- HANDLERS ---
    const handleAddNew = () => {
        setEditingBox(null);
        setIsModalOpen(true);
    };

    const handleEdit = (box: ShippingBox) => {
        setEditingBox(box);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this box definition?")) {
            const res = await deleteShippingBox(id);
            if (res.success) {
                toast.success(res.message || "Box removed successfully");
                refreshData();
            } else {
                toast.error(res.error || "Error deleting box");
            }
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const res = await toggleBoxStatus(id, !currentStatus);
        if (res.success) {
            toast.success("Status updated");
            refreshData();
        } else {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in mb-[30px]">
            
            {/* Header & Add Button */}
            <div className="flex items-center gap-3 mb-[15px]">
                <h2 className="text-[23px] font-normal text-[#1d2327] m-0">Packaging & Boxes</h2>
                <button 
                    onClick={handleAddNew} 
                    className="bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[10px] py-[2px] text-[13px] font-semibold cursor-pointer"
                >
                    Add New Box
                </button>
            </div>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">Define the boxes you use to ship products. These dimensions are used to calculate accurate shipping rates.</p>

            {/* Title for Custom Boxes */}
            <h3 className="text-[14px] font-semibold text-[#1d2327] mb-[10px] pb-0 border-none">My Custom Boxes</h3>
            
            {/* WP List Table for Custom Boxes */}
            <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border mb-[30px]">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[30%]">Name / Description</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Dimensions (L×W×H)</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Max Weight</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Box Weight</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shippingBoxes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-[10px] py-[20px] text-center text-[#646970] italic">
                                    No custom boxes added yet. Create one to get accurate shipping rates.
                                </td>
                            </tr>
                        ) : shippingBoxes.map((box, index) => (
                            <tr key={box.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] group ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                <td className="px-[10px] py-[10px]">
                                    <strong className="text-[#2271b1] block">{box.name}</strong>
                                    
                                    {/* WP Row Actions (Hover to reveal) */}
                                    <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(box)}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-[#c3c4c7] mx-1">|</span>
                                        <button 
                                            onClick={() => handleDelete(box.id)}
                                            className="bg-transparent border-none text-[#d63638] hover:underline cursor-pointer p-0"
                                        >
                                            Trash
                                        </button>
                                    </div>
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a]">
                                    {Number(box.length)} × {Number(box.width)} × {Number(box.height)} cm
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a]">
                                    {box.maxWeight ? `${Number(box.maxWeight)} kg` : <span className="text-[#a7aaad]">—</span>}
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a]">
                                    {box.weight ? `${Number(box.weight)} kg` : <span className="text-[#a7aaad]">—</span>}
                                </td>
                                <td className="px-[10px] py-[10px]">
                                    {box.isEnabled ? (
                                        <button onClick={() => handleToggle(box.id, box.isEnabled)} className="bg-transparent border-none text-[#007017] hover:underline cursor-pointer p-0 font-semibold">Active</button>
                                    ) : (
                                        <button onClick={() => handleToggle(box.id, box.isEnabled)} className="bg-transparent border-none text-[#646970] hover:underline cursor-pointer p-0">Disabled</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Title for Transdirect Default Boxes */}
            {transdirectBoxes && transdirectBoxes.length > 0 && (
                <>
                    <h3 className="text-[14px] font-semibold text-[#1d2327] mb-[10px] pb-0 border-none">Transdirect Default Boxes</h3>
                    <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                                    <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Type / Code</th>
                                    <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Dimensions (L×W×H)</th>
                                    <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Max Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transdirectBoxes.map((tb, index) => (
                                    <tr key={tb.id} className={`border-b border-[#f0f0f1] last:border-none ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                        <td className="px-[10px] py-[10px] font-medium text-[#3c434a]">
                                            {tb.description || tb.code}
                                        </td>
                                        <td className="px-[10px] py-[10px] text-[#646970]">
                                            {Number(tb.length)} × {Number(tb.width)} × {Number(tb.height)} cm
                                        </td>
                                        <td className="px-[10px] py-[10px] text-[#646970]">
                                            {tb.maxWeight ? `${Number(tb.maxWeight)} kg` : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <Box_Form_Modal 
                    box={editingBox} 
                    onClose={() => setIsModalOpen(false)} 
                    refreshData={refreshData}
                />
            )}
        </div>
    );
}