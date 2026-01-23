// File: app/admin/settings/shipping/_components/Packaging/Packaging_List.tsx

"use client";

import { useState } from "react";
import { deleteShippingBox, toggleBoxStatus } from "@/app/actions/admin/settings/shipping/packaging";
import { ShippingBox, TransdirectBox } from "@prisma/client"; 
import { Plus, Package, Trash2, Edit, Box, Info } from "lucide-react";
import { toast } from "react-hot-toast";
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
        <div className="space-y-6 animate-in fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Package size={20} className="text-[#2271b1]" />
                        Packaging & Boxes
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Define the boxes you use to ship products. These dimensions are used to calculate accurate shipping rates.
                    </p>
                </div>
                <button 
                    onClick={handleAddNew} 
                    className="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] text-sm transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add New Box
                </button>
            </div>

            {/* Custom Boxes Table */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 text-sm">
                    My Custom Boxes
                </div>
                
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm min-w-[700px]">
                        <thead className="bg-white border-b text-slate-500">
                            <tr>
                                <th className="p-4 font-semibold w-1/3">Name / Description</th>
                                <th className="p-4 font-semibold">Dimensions (LxWxH)</th>
                                <th className="p-4 font-semibold">Max Weight</th>
                                <th className="p-4 font-semibold">Box Weight</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shippingBoxes.map((box) => (
                                <tr key={box.id} className="hover:bg-slate-50 group transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{box.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5 hidden sm:block">ID: {box.id.slice(0, 8)}...</div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Box size={14} className="text-slate-400"/>
                                            {/* ✅ FIX: Convert Decimal to string/number for rendering */}
                                            {Number(box.length)} x {Number(box.width)} x {Number(box.height)} cm
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {/* ✅ FIX: Handle nullable Decimal */}
                                        {box.maxWeight ? `${Number(box.maxWeight)} kg` : <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {/* ✅ FIX: Handle nullable Decimal */}
                                        {box.weight ? `${Number(box.weight)} kg` : <span className="text-slate-300">-</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => handleToggle(box.id, box.isEnabled)}
                                            className={`px-2 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap ${
                                                box.isEnabled 
                                                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                        >
                                            {box.isEnabled ? "Active" : "Disabled"}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(box)} className="p-2 text-slate-400 hover:text-[#2271b1] hover:bg-blue-50 rounded transition-all">
                                                <Edit size={16}/>
                                            </button>
                                            <button onClick={() => handleDelete(box.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {shippingBoxes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500 italic bg-slate-50/50">
                                        No custom boxes added yet. Create one to get accurate shipping rates.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transdirect Boxes Section */}
            {transdirectBoxes && transdirectBoxes.length > 0 && (
                 <div className="mt-8 bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden opacity-80">
                    <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 text-sm flex items-center gap-2">
                        <Info size={16} /> Transdirect Default Boxes
                    </div>
                    <div className="overflow-x-auto w-full">
                         <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-white border-b text-slate-500">
                                <tr>
                                    <th className="p-3 font-semibold">Type / Code</th>
                                    <th className="p-3 font-semibold">Dimensions</th>
                                    <th className="p-3 font-semibold">Max Weight</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transdirectBoxes.map((tb) => (
                                    <tr key={tb.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-600">{tb.description || tb.code}</td>
                                        {/* ✅ FIX: Convert Decimal to number for Transdirect boxes too */}
                                        <td className="p-3 text-slate-500">{Number(tb.length)} x {Number(tb.width)} x {Number(tb.height)} cm</td>
                                        <td className="p-3 text-slate-500">{tb.maxWeight ? `${Number(tb.maxWeight)} kg` : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                 </div>
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