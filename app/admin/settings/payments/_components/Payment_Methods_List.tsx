// File: app/admin/settings/payments/_components/Payment_Methods_List.tsx

"use client";

import { useState } from "react";
import { PaymentMethod } from "../types"; // Path fix: go back one step
import { togglePaymentMethod } from "@/app/actions/settings/payments/general";
import { toast } from "react-hot-toast";
import Payment_Config_Modal from "./Payment_Config_Modal";

interface Props {
    methods: PaymentMethod[];
    refreshData: () => void;
}

export default function Payment_Methods_List({ methods, refreshData }: Props) {
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const res = await togglePaymentMethod(id, !currentStatus);
        if (res.success) {
            toast.success(currentStatus ? "Method disabled" : "Method enabled");
            refreshData();
        } else {
            toast.error("Failed to update status");
        }
    };

    return (
        <>
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 w-24 text-center">Enabled</th>
                            <th className="p-4 w-1/4">Method</th>
                            <th className="p-4">Description</th>
                            <th className="p-4 text-right w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {methods.map((method) => (
                            <tr key={method.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={method.isEnabled} 
                                            onChange={() => handleToggle(method.id, method.isEnabled)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2271b1]"></div>
                                    </label>
                                </td>
                                <td className="p-4 font-bold text-[#2271b1]">
                                    <span 
                                        className="cursor-pointer hover:underline" 
                                        onClick={() => setEditingMethod(method)}
                                    >
                                        {method.name}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500 text-xs sm:text-sm">{method.description}</td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => setEditingMethod(method)}
                                        className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-100 text-slate-700 transition-colors"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Config Modal */}
            {editingMethod && (
                <Payment_Config_Modal 
                    method={editingMethod} 
                    onClose={() => setEditingMethod(null)} 
                    refreshData={refreshData}
                />
            )}
        </>
    );
}