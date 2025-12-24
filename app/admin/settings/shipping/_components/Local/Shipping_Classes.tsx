

"use client";

import { useState } from "react";
import { createShippingClass, deleteShippingClass } from "@/app/actions/settings/shipping/local";
import { ComponentProps } from "../../types";
import { Plus, Trash2, Package, X } from "lucide-react";
import { toast } from "react-hot-toast";

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

    return (
        <div className="space-y-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Shipping Classes</h2>
                    <p className="text-sm text-slate-500">Shipping classes can be used to group products of similar type to provide different rates, e.g., "Heavy".</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] text-sm">
                    <Plus size={16} /> Add shipping class
                </button>
            </div>

            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="p-4 font-bold text-slate-700">Class Name</th>
                                <th className="p-4 font-bold text-slate-700">Slug</th>
                                <th className="p-4 font-bold text-slate-700">Description</th>
                                <th className="p-4 font-bold text-slate-700 text-center">Product Count</th>
                                <th className="p-4 font-bold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {classes.map((cls) => (
                                <tr key={cls.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 font-bold text-[#2271b1]">{cls.name}</td>
                                    <td className="p-4 text-slate-600 font-mono text-xs">{cls.slug}</td>
                                    <td className="p-4 text-slate-600">{cls.description || "-"}</td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                                            {cls._count?.products || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDeleteClass(cls.id)} className="text-slate-400 hover:text-red-600">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {classes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">No shipping classes found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Shipping Class</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                                <input name="name" required placeholder="e.g. Heavy" className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Slug</label>
                                <input name="slug" required placeholder="e.g. heavy" className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea name="description" rows={3} className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm font-bold">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#2271b1] text-white rounded text-sm font-bold">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}